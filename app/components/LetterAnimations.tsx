import { Animated, Dimensions, View } from 'react-native';

interface AnimatingLetter {
  id: string;
  letter: string;
  position: Animated.ValueXY;
}

interface LetterAnimationsProps {
  animatingLetters: AnimatingLetter[];
}

export default function LetterAnimations({ animatingLetters }: LetterAnimationsProps) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {animatingLetters.map((animLetter) => (
        <Animated.View
          key={animLetter.id}
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            backgroundColor: '#8B5CF6',
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
            transform: animLetter.position.getTranslateTransform(),
          }}
        >
          <Animated.Text
            style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            {animLetter.letter}
          </Animated.Text>
        </Animated.View>
      ))}
    </View>
  );
}