import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
  FlatList,
  ViewToken,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Mascot images ───────────────────────────────────
const MASCOT_IMAGES = {
  idle: require('../../assets/mascot/mascot-idle.png'),
  greet: require('../../assets/mascot/mascot-greet.png'),
  smart: require('../../assets/mascot/mascot-smart.png'),
  celebrate: require('../../assets/mascot/mascot-celebrate.png'),
} as const;

type MascotState = keyof typeof MASCOT_IMAGES;

// ─── Slide data ──────────────────────────────────────
interface Slide {
  id: string;
  mascot: MascotState;
  mascotSize: number;
  title: string;
  subtitle: string;
  cta: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    id: 'hook',
    mascot: 'greet',
    mascotSize: 180,
    title: 'Your money,\nfinally clear.',
    subtitle: 'Log every rupee in 2 taps. See exactly where it all goes.',
    cta: 'Get Started',
    accent: Colors.primary,
  },
  {
    id: 'smart-log',
    mascot: 'idle',
    mascotSize: 160,
    title: 'Tap, don\'t type.',
    subtitle: 'Koin learns your habits and suggests what to log before you even open it.',
    cta: 'Next',
    accent: '#059669',
  },
  {
    id: 'insights',
    mascot: 'smart',
    mascotSize: 160,
    title: 'Know before\nit\'s too late.',
    subtitle: 'Weekly breakdowns, overspend alerts, and insights that actually make sense.',
    cta: 'Let\'s Go',
    accent: '#2563EB',
  },
];

// ─── Floating mascot component ───────────────────────
function FloatingMascot({ state, size }: { state: MascotState; size: number }) {
  const floatY = useSharedValue(0);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1400 }),
        withTiming(0, { duration: 1400 }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Image
        source={MASCOT_IMAGES[state]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ─── Page dots ───────────────────────────────────────
function PageDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Single slide ────────────────────────────────────
function SlideItem({ slide }: { slide: Slide }) {
  return (
    <View style={styles.slide}>
      <FloatingMascot state={slide.mascot} size={slide.mascotSize} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────
interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const ctaScale = useSharedValue(1);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleCta = useCallback(() => {
    ctaScale.value = withSequence(
      withSpring(0.94, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 }),
    );

    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      onDone();
    }
  }, [activeIndex, onDone]);

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const currentSlide = SLIDES[activeIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.canvas} />

      {/* Skip */}
      <Pressable
        style={styles.skipButton}
        onPress={onDone}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SlideItem slide={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={styles.flatList}
      />

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <PageDots count={SLIDES.length} activeIndex={activeIndex} />

        <Animated.View style={[styles.ctaWrapper, ctaStyle]}>
          <Pressable
            style={[styles.ctaButton, { backgroundColor: currentSlide.accent }]}
            onPress={handleCta}
            android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
          >
            <Text style={styles.ctaText}>{currentSlide.cta}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 40,
  },
  textBlock: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.borderMedium,
  },
  ctaWrapper: {
    width: '100%',
  },
  ctaButton: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
