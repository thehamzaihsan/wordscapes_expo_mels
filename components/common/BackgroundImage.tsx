import { CategoryType, useCurrentCategory } from "@/hooks/useCurrentCategory";
import { useTheme } from "@/hooks/useTheme";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useBackgroundSelection } from "@/contexts/BackgroundContext";
import { useEffect, useCallback, useRef } from "react";
import { ImageBackground, Platform, View } from "react-native";
import { useFocusEffect } from "expo-router";

// Map category names to their corresponding image files
const getCategoryImage = (category: CategoryType) => {
  switch (category) {
    case 'Mountain':
      return require("../../images/mountain.jpg");
    case 'Ocean':
      return require("../../images/ocean.jpg");
    case 'Forest':
      return require("../../images/forest.png");
    default:
      return require("../../images/default_background.jpg");
  }
};

// Map category names to their corresponding web image paths
const getCategoryWebImagePath = (category: CategoryType) => {
  switch (category) {
    case 'Mountain':
      return "/images/mountain.jpg";
    case 'Ocean':
      return "/images/ocean.jpg";
    case 'Forest':
      return "/images/forest.png";
    default:
      return "/images/default_background.jpg";
  }
};

interface BackgroundImageProps {
  useProfiledBackground?: boolean;
}

export default function BackgroundImage({ useProfiledBackground = true }: BackgroundImageProps) {
  const { themeName } = useTheme();
  const { currentCategory, isLoading } = useCurrentCategory();
  const { user } = useSupabaseAuth();
  const { selectedBackground, clearBackground, refreshBackground } = useProfiledBackground ? useBackgroundSelection() : { selectedBackground: null, clearBackground: () => {}, refreshBackground: () => {} };
  const isDark = themeName === "dark" || themeName === "game";
  const prevUserRef = useRef(user);

  // Reset background when user signs out
  useEffect(() => {
    if (useProfiledBackground && prevUserRef.current && !user) {
      console.log(`[BackgroundImage] User signed out, clearing background`);
      clearBackground();
    }
    prevUserRef.current = user;
  }, [user, clearBackground, useProfiledBackground]);

  // Refresh background when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (useProfiledBackground) {
        console.log(`[BackgroundImage] Screen focused, refreshing background`);
        refreshBackground();
      }
    }, [refreshBackground, useProfiledBackground])
  );

  let displayCategory: CategoryType = 'Mountain';
  if (useProfiledBackground && selectedBackground) {
    displayCategory = selectedBackground;
  } else if (useProfiledBackground && !isLoading && currentCategory) {
    displayCategory = currentCategory;
  }

  const overlay = isDark ? (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.14)",
      }}
    />
  ) : null;

  if (Platform.OS === "web") {
    // Use CSS background-image for web - much more reliable
    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          // @ts-ignore - web-specific styles
          backgroundImage: `url(${getCategoryWebImagePath(displayCategory)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transition: "background-image 0.5s ease-in-out", // Smooth transition for web
        }}
      >
        {overlay}
      </View>
    );
  }

  // Use ImageBackground component for mobile platforms to support overlay
  return (
    <ImageBackground
      source={getCategoryImage(displayCategory)}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: -1,
      }}
      resizeMode="cover"
    >
      {overlay}
    </ImageBackground>
  );
}
