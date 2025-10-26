import "dotenv/config";

// Convert existing app.json to a dynamic config so we can inject env-backed values.
export default ({ config }: any) => ({
  expo: {
    name: "WordSpring",
    slug: "WordSpring",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "com.hexadevs.word",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.wordscapesexpo",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.hexadevs.word",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "assets/images/WorldSprings_logo_1.png",
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
        projectId: "5a93eb4b-90fb-41d2-9f27-5eb2cfd1a6ab",
      },
      // Inject PayPal client id to be available at runtime
      paypalClientId:
        process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID ||
        process.env.EXPO_PAYPAL_CLIENT_ID ||
        "",
    },
    owner: "hamzaihsan",
  },
});