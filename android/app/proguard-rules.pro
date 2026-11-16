# BarPilot ProGuard / R8 Rules

# Preserve MainActivity
-keep public class eu.barpilot.app.MainActivity {
    public *;
}

# Preserve WebView JavaScript Interfaces and WebChromeClient callbacks
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX Support
-keep class androidx.appcompat.** { *; }
-keep class androidx.swiperefreshlayout.** { *; }
-keep class androidx.activity.** { *; }
-dontwarn androidx.**
