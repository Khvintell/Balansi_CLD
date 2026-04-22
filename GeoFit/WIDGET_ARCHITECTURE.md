# 🏠 Bio-Avatar Home Screen Widget — Architecture Foundation

> **Status:** Architectural Blueprint (requires custom dev client for native execution)  
> **Platforms:** iOS (WidgetKit) & Android (AppWidget)  
> **Data Sync:** AsyncStorage → UserDefaults (iOS) / SharedPreferences (Android)

---

## 1. Overview

Pro users can add their Bio-Avatar to their Home Screen as a native widget. The widget
displays a simplified avatar representation with the current `bodyState` and `timeState`,
updating periodically via native background refresh mechanisms.

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                React Native App                  │
│                                                  │
│  useAvatarStore ──► AsyncStorage                 │
│       │                │                         │
│       │         ┌──────▼──────┐                  │
│       │         │ Bridge Layer │                  │
│       │         │ (Config Plugin) │              │
│       │         └──────┬──────┘                  │
│       │                │                         │
│  ┌────▼────┐    ┌──────▼──────┐                  │
│  │   iOS   │    │  Android    │                  │
│  │ UserDef │    │ SharedPrefs │                  │
│  └────┬────┘    └──────┬──────┘                  │
│       │                │                         │
│  ┌────▼────┐    ┌──────▼──────┐                  │
│  │WidgetKit│    │ AppWidget   │                  │
│  │Timeline │    │ Provider    │                  │
│  │Provider │    │             │                  │
│  └─────────┘    └─────────────┘                  │
└─────────────────────────────────────────────────┘
```

---

## 2. Data Sync Strategy

### 2.1 React Native → Native Storage

The avatar state must be written to native storage that widgets can access:

```typescript
// services/widgetBridge.ts — DATA SYNC BRIDGE
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

interface WidgetData {
  bodyState: 'heavy' | 'normal' | 'athletic';
  timeState: 'morning' | 'day' | 'evening' | 'night';
  streakLevel: number;
  streak: number;
  weight: number;
  lastUpdated: string;
  isPro: boolean;
}

/**
 * Syncs avatar state to native storage accessible by Home Screen widgets.
 * 
 * iOS: Writes to App Group UserDefaults (shared container)
 * Android: Writes to SharedPreferences accessible by AppWidget
 * 
 * IMPORTANT: This function should be called every time the avatar state changes:
 * - After profile sync (weight/BMI update)
 * - After streak update
 * - On app foreground (time state refresh)
 */
export async function syncWidgetData(data: WidgetData): Promise<void> {
  try {
    // Store in AsyncStorage as canonical source
    await AsyncStorage.setItem('widget_avatar_data', JSON.stringify(data));
    
    if (Platform.OS === 'ios') {
      // iOS: Use NativeModules to write to App Group UserDefaults
      // NativeModules.WidgetBridge?.setWidgetData(JSON.stringify(data));
      // ↑ Uncomment when native module is implemented
    } else if (Platform.OS === 'android') {
      // Android: Use NativeModules to write to SharedPreferences + trigger widget update
      // NativeModules.WidgetBridge?.updateWidgetData(JSON.stringify(data));
      // ↑ Uncomment when native module is implemented
    }
  } catch (e) {
    console.warn('[WidgetBridge] Failed to sync widget data:', e);
  }
}
```

### 2.2 Integration Point in useAvatarStore

```typescript
// In store/useAvatarStore.ts — add to syncFromProfile:
// import { syncWidgetData } from '../services/widgetBridge';
// 
// After computing new state:
// syncWidgetData({
//   bodyState: newBodyState,
//   timeState: deriveTimeState(),
//   streakLevel: newStreakLevel,
//   streak,
//   weight,
//   lastUpdated: new Date().toISOString(),
//   isPro: true, // Pro-only feature
// });
```

---

## 3. iOS WidgetKit Implementation

### 3.1 Expo Config Plugin

```javascript
// plugins/withBioAvatarWidget.js
const { withXcodeProject, withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

const APP_GROUP = 'group.com.beka.balansi';
const WIDGET_BUNDLE_ID = 'com.beka.balansi.BioAvatarWidget';

function withBioAvatarWidget(config) {
  // Step 1: Add App Group entitlement (for shared UserDefaults)
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [APP_GROUP];
    return config;
  });

  // Step 2: Add widget extension target to Xcode project
  config = withXcodeProject(config, async (config) => {
    const pbxProject = config.modResults;
    
    // NOTE: Widget extension target must be added manually or via a helper tool
    // The widget target needs:
    // - Swift source files (BioAvatarWidget.swift, TimelineProvider.swift)
    // - Assets.xcassets for widget preview images
    // - Info.plist with NSExtension configuration
    // - Same App Group entitlement
    
    console.log('[BioAvatarWidget] Xcode project configured for widget extension');
    return config;
  });

  return config;
}

module.exports = withBioAvatarWidget;
```

### 3.2 SwiftUI Widget Code (iOS)

```swift
// ios/BioAvatarWidget/BioAvatarWidget.swift

import WidgetKit
import SwiftUI

// ─── Data Model ───
struct AvatarWidgetData {
    let bodyState: String   // "heavy", "normal", "athletic"
    let timeState: String   // "morning", "day", "evening", "night"
    let streakLevel: Int    // 0-3
    let streak: Int
    let weight: Double
    let lastUpdated: Date
    
    static let placeholder = AvatarWidgetData(
        bodyState: "normal", timeState: "day",
        streakLevel: 1, streak: 5, weight: 75.0,
        lastUpdated: Date()
    )
}

// ─── Timeline Provider ───
// Responsible for providing widget data at specific times
struct AvatarTimelineProvider: TimelineProvider {
    
    // The App Group container shared between main app and widget
    let appGroup = UserDefaults(suiteName: "group.com.beka.balansi")
    
    func placeholder(in context: Context) -> AvatarEntry {
        AvatarEntry(date: Date(), data: .placeholder)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (AvatarEntry) -> Void) {
        let data = loadWidgetData()
        completion(AvatarEntry(date: Date(), data: data))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<AvatarEntry>) -> Void) {
        let data = loadWidgetData()
        let currentDate = Date()
        
        // BACKGROUND FETCH STRATEGY:
        // Generate entries for each time-of-day transition
        // This ensures the avatar's timeState updates even without app interaction
        var entries: [AvatarEntry] = []
        
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: currentDate)
        
        // Create entries for each time boundary (5am, 10am, 5pm, 9pm)
        let timeBoundaries = [5, 10, 17, 21]
        for boundary in timeBoundaries {
            if boundary > hour {
                var components = calendar.dateComponents([.year, .month, .day], from: currentDate)
                components.hour = boundary
                if let date = calendar.date(from: components) {
                    var updatedData = data
                    // Compute timeState for this hour
                    switch boundary {
                    case 5: updatedData = AvatarWidgetData(bodyState: data.bodyState, timeState: "morning", streakLevel: data.streakLevel, streak: data.streak, weight: data.weight, lastUpdated: date)
                    case 10: updatedData = AvatarWidgetData(bodyState: data.bodyState, timeState: "day", streakLevel: data.streakLevel, streak: data.streak, weight: data.weight, lastUpdated: date)
                    case 17: updatedData = AvatarWidgetData(bodyState: data.bodyState, timeState: "evening", streakLevel: data.streakLevel, streak: data.streak, weight: data.weight, lastUpdated: date)
                    case 21: updatedData = AvatarWidgetData(bodyState: data.bodyState, timeState: "night", streakLevel: data.streakLevel, streak: data.streak, weight: data.weight, lastUpdated: date)
                    default: break
                    }
                    entries.append(AvatarEntry(date: date, data: updatedData))
                }
            }
        }
        
        // Always include current entry
        entries.insert(AvatarEntry(date: currentDate, data: data), at: 0)
        
        // Refresh after 1 hour if no time boundary is upcoming
        let timeline = Timeline(entries: entries, policy: .after(currentDate.addingTimeInterval(3600)))
        completion(timeline)
    }
    
    // Reads avatar data from shared App Group UserDefaults
    func loadWidgetData() -> AvatarWidgetData {
        guard let jsonString = appGroup?.string(forKey: "widget_avatar_data"),
              let jsonData = jsonString.data(using: .utf8),
              let dict = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
            return .placeholder
        }
        
        return AvatarWidgetData(
            bodyState: dict["bodyState"] as? String ?? "normal",
            timeState: dict["timeState"] as? String ?? "day",
            streakLevel: dict["streakLevel"] as? Int ?? 0,
            streak: dict["streak"] as? Int ?? 0,
            weight: dict["weight"] as? Double ?? 75.0,
            lastUpdated: Date()
        )
    }
}

// ─── Timeline Entry ───
struct AvatarEntry: TimelineEntry {
    let date: Date
    let data: AvatarWidgetData
}

// ─── Widget View ───
// NOTE: The avatar rendering in SwiftUI must be a simplified version
// of the React Native SVG. Use SwiftUI shapes (Circle, Ellipse, Path)
// to replicate the character design.
struct AvatarWidgetView: View {
    let data: AvatarWidgetData
    
    var bodyColor: Color {
        Color(red: 29/255, green: 185/255, blue: 84/255) // C.primary
    }
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color(red: 10/255, green: 58/255, blue: 46/255), .black],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(spacing: 4) {
                // Simplified avatar (SwiftUI shapes)
                ZStack {
                    // Head
                    Circle()
                        .fill(Color(red: 255/255, green: 220/255, blue: 193/255))
                        .frame(width: 40, height: 40)
                        .offset(y: -22)
                    
                    // Body
                    Ellipse()
                        .fill(bodyColor)
                        .frame(width: bodyWidth, height: 35)
                        .offset(y: 12)
                }
                .frame(height: 60)
                
                // Streak info
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 10))
                        .foregroundColor(.orange)
                    Text("\(data.streak)d")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .padding(8)
        }
    }
    
    var bodyWidth: CGFloat {
        switch data.bodyState {
        case "heavy": return 44
        case "athletic": return 30
        default: return 36
        }
    }
}

// ─── Widget Configuration ───
@main
struct BioAvatarWidget: Widget {
    let kind = "BioAvatarWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AvatarTimelineProvider()) { entry in
            AvatarWidgetView(data: entry.data)
        }
        .configurationDisplayName("Bio-Avatar")
        .description("ნახე შენი ციფრული ტყუპი მთავარ ეკრანზე!")
        .supportedFamilies([.systemSmall])
    }
}
```

---

## 4. Android AppWidget Implementation

### 4.1 Expo Config Plugin (Android)

```javascript
// Add to plugins/withBioAvatarWidget.js (Android section)

const { withAndroidManifest } = require('@expo/config-plugins');

function withAndroidWidget(config) {
  config = withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application[0];
    
    // Add AppWidget receiver
    if (!application.receiver) application.receiver = [];
    application.receiver.push({
      '$': {
        'android:name': '.BioAvatarWidgetProvider',
        'android:label': 'Bio-Avatar',
        'android:exported': 'true',
      },
      'intent-filter': [{
        action: [{ '$': { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
      }],
      'meta-data': [{
        '$': {
          'android:name': 'android.appwidget.provider',
          'android:resource': '@xml/bio_avatar_widget_info',
        },
      }],
    });
    
    return config;
  });
  
  return config;
}
```

### 4.2 Android Widget XML

```xml
<!-- android/app/src/main/res/xml/bio_avatar_widget_info.xml -->
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="80dp"
    android:minHeight="80dp"
    android:updatePeriodMillis="3600000"
    android:initialLayout="@layout/bio_avatar_widget"
    android:resizeMode="none"
    android:widgetCategory="home_screen"
    android:previewImage="@drawable/widget_preview"
    android:description="@string/widget_description" />
```

### 4.3 Android Widget Provider (Kotlin)

```kotlin
// android/.../BioAvatarWidgetProvider.kt

package com.beka.balansi

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.content.SharedPreferences
import org.json.JSONObject

class BioAvatarWidgetProvider : AppWidgetProvider() {
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }
    
    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Read avatar data from SharedPreferences
        // (synced from React Native via NativeModules bridge)
        val prefs = context.getSharedPreferences("BalansiWidgetData", Context.MODE_PRIVATE)
        val jsonStr = prefs.getString("widget_avatar_data", null)
        
        val views = RemoteViews(context.packageName, R.layout.bio_avatar_widget)
        
        if (jsonStr != null) {
            try {
                val data = JSONObject(jsonStr)
                val streak = data.optInt("streak", 0)
                val bodyState = data.optString("bodyState", "normal")
                
                // Update widget views based on avatar state
                views.setTextViewText(R.id.streak_text, "${streak}d 🔥")
                
                // Set avatar image based on bodyState
                // NOTE: Use pre-rendered PNG assets for each body state
                // since Android widgets don't support SVG rendering
                val avatarRes = when (bodyState) {
                    "heavy" -> R.drawable.avatar_heavy
                    "athletic" -> R.drawable.avatar_athletic
                    else -> R.drawable.avatar_normal
                }
                views.setImageViewResource(R.id.avatar_image, avatarRes)
                
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
```

---

## 5. Build & Deployment Steps

### 5.1 Prerequisites

```bash
# This feature requires a CUSTOM DEV CLIENT (Expo Go cannot run native widgets)

# Step 1: Install EAS CLI
npm install -g eas-cli

# Step 2: Configure EAS build
eas build:configure

# Step 3: Prebuild to generate native projects
npx expo prebuild

# Step 4: Add widget files to native projects
# iOS: Add BioAvatarWidget target and Swift files to ios/ directory
# Android: Add widget XML, layout, and Kotlin files to android/ directory
```

### 5.2 app.json Configuration

```json
{
  "expo": {
    "plugins": [
      // ... existing plugins
      ["./plugins/withBioAvatarWidget", {
        "iosAppGroup": "group.com.beka.balansi",
        "widgetName": "BioAvatarWidget"
      }]
    ]
  }
}
```

### 5.3 Testing Workflow

```bash
# Build custom dev client with widget support
eas build --profile development --platform ios

# Or for local testing
npx expo run:ios
npx expo run:android
```

---

## 6. Background Fetch & Data Freshness

### iOS (WidgetKit Timeline)
- **WidgetKit** uses a `TimelineProvider` that generates entries at time boundaries (5am, 10am, 5pm, 9pm)
- The `bodyState` and `streakLevel` update when the main app writes to **App Group UserDefaults**
- The `timeState` is computed natively by the widget based on the current hour
- **Budget:** iOS allows ~40-70 timeline reloads per day

### Android (AppWidget UpdatePeriodMillis)
- `updatePeriodMillis` is set to 3,600,000ms (1 hour)
- Each update reads from **SharedPreferences** (synced by RN bridge)
- Uses pre-rendered PNG assets for avatar states (Android widgets can't render SVG)
- **WorkManager** can be added for more reliable background updates

### Data Flow on App Open
```
App Opens → useAvatarStore.refreshAll(profile)
          → syncWidgetData(newState)
          → Writes to UserDefaults / SharedPreferences
          → iOS: WidgetCenter.shared.reloadAllTimelines()
          → Android: AppWidgetManager.notifyAppWidgetViewDataChanged()
```

---

## 7. Future Enhancements

- **Interactive Widgets (iOS 17+):** Allow tapping the avatar to log water intake
- **Live Activities (iOS 16+):** Show avatar on Lock Screen during active workout
- **Glance Widgets (watchOS):** Minimal avatar on Apple Watch
- **Dynamic Island:** Show streak counter in Dynamic Island during the day
