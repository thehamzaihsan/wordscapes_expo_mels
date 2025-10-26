import { useTheme } from "@/hooks/useTheme";
import { useCurrentCategory, CategoryType } from "@/hooks/useCurrentCategory";
import { ImageBackground, Platform, View } from "react-native";
import { useState, useEffect } from "react";

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

export default function BackgroundImage() {
  const { themeName } = useTheme();
  const { currentCategory, isLoading } = useCurrentCategory();
  const [displayCategory, setDisplayCategory] = useState<CategoryType>('Mountain');
  const isDark = themeName === "dark" || themeName === "game";

  // Update display category with a smooth transition
  useEffect(() => {
    if (!isLoading) {
      if (currentCategory !== displayCategory) {
        console.log(`[BackgroundImage] Switching from ${displayCategory} to ${currentCategory}`);
      }
      setDisplayCategory(currentCategory);
    }
  }, [currentCategory, isLoading, displayCategory]);

  const overlay = isDark ? (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
