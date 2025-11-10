import "dotenv/config";

// This is now your one and only config file.
export default ({ config }: any) => ({
  expo: {
    name: "WordSprings",
    slug: "wordsprings", // <--- FIX #1: Matched this to your EAS project
    version: "1.0.0",
    orientation: "portrait",
    scheme: "com.hexadevs.word",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hexadevs.word", // <--- FIX #2: Matched this to your Android package
      icon: "./assets/ios/iTunesArtwork@3x.png",
    },
    android: {
      icon: "./assets/android/ic_launcher-web.png",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android/ic_launcher_foreground.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.hexadevs.word",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro" // <-- I added this back from your app.json, as it was missing
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "assets/images/WorldSprings_logo_1.png", // This was missing from your app.json plugins, good.
          resizeMode: "cover",
          backgroundColor: "#6757f7",
          dark: { backgroundColor: "#6757f7" },
        },
      ],
      "@react-native-google-signin/google-signin",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        "projectId": "110cce74-943b-4f02-9aff-3715dfe84f34" // <--- ADD THIS LINE
      },
      paypalClientId:
        process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID ||
        process.env.EXPO_PAYPAL_CLIENT_ID ||
        "",
    },
    owner: "hamzaihsan",
  },
});