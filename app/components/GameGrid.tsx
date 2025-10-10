import { useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get("window");

interface GridCell {
  letter: string | null;
  isRevealed: boolean;
  isActive: boolean;
  belongsToWords: string[];
}

interface GameGridProps {
  gameGrid: GridCell[][] | null;
  cellSize: number;
  hintAnim: { row: number; col: number; anim: Animated.Value } | null;
  gridCellRefs: React.MutableRefObject<{ [key: string]: View }>;
}

export default function GameGrid({
  gameGrid,
  cellSize,
  hintAnim,
  gridCellRefs,
}: GameGridProps) {
  if (!gameGrid) return null;

  // Simplified approach: display as a single row
  const firstRow = gameGrid[0] || [];
  const fixedCellSize = 40;
  const totalWidth = firstRow.length * (fixedCellSize + 8); // 8 for margins

  const renderCell = (cell: GridCell, colIndex: number) => {
    const key = `0-${colIndex}`;
    const isHintCell = hintAnim && hintAnim.row === 0 && hintAnim.col === colIndex;

    if (!cell.letter) {
      return null; // Don't render empty cells
    }

    return (
      <Animated.View
        key={key}
        ref={(ref) => {
          if (ref) gridCellRefs.current[key] = ref;
        }}
        style={[
          styles.cell,
          { width: fixedCellSize, height: fixedCellSize },
          cell.isRevealed ? styles.revealedCell : styles.hiddenCell,
          isHintCell && {
            transform: [{ scale: hintAnim.anim }],
          },
        ]}
      >
        <Text
          style={[
            styles.cellText,
            { fontSize: fixedCellSize * 0.5 },
            cell.isRevealed ? styles.revealedCellText : styles.hiddenCellText,
          ]}
        >
          {cell.letter}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.gridContainer}>
      <View style={[styles.row, { width: totalWidth }]}>
        {firstRow.map((cell, colIndex) => renderCell(cell, colIndex))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cell: {
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  hiddenCell: {
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  revealedCell: {
    backgroundColor: "#8B5CF6",
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  cellText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  hiddenCellText: {
    color: "transparent",
  },
  revealedCellText: {
    color: "#fff",
  },
});