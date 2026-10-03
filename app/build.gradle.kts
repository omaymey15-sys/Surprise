plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.surprise.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.surprise.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        // URL du serveur Render : lue depuis la variable GitHub "API_URL" (sinon valeur par défaut ci-dessous)
        val apiUrl = System.getenv("API_URL")?.takeIf { it.isNotBlank() }
            ?: "https://surprise-api.onrender.com"
        buildConfigField("String", "API_URL", "\"$apiUrl\"")
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.exifinterface:exifinterface:1.3.7")

    // Carte OpenStreetMap (sans clé API)
    implementation("org.osmdroid:osmdroid-android:6.1.20")

    // Position GPS
    implementation("com.google.android.gms:play-services-location:21.3.0")
}
