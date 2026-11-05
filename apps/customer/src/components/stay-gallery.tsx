import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import { Icon } from '@/components/icon';
import { colors, fonts } from '@/theme';
import type { Stay } from '@/types';

type GalleryProps = { stay: Stay; compact?: boolean; topInset?: number; onOpen?: () => void; initialIndex?: number; onIndexChange?: (index: number) => void };

function Gallery({ stay, compact = false, topInset = 0, onOpen, initialIndex = 0, onIndexChange }: GalleryProps) {
  const photos = stay.gallery.length ? stay.gallery : [stay.image];
  const startIndex = Math.min(Math.max(initialIndex, 0), photos.length - 1);
  const gallery = useRef<ScrollView>(null);
  const selectedRef = useRef(startIndex);
  const targetRef = useRef<number | null>(null);
  const [selected, setSelected] = useState(startIndex);
  useEffect(() => { onIndexChange?.(selected); }, [onIndexChange, selected]);
  const [width, setWidth] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [advances, setAdvances] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const focused = useIsFocused();
  const hasSlides = photos.length > 1;
  // A single brief preview introduces the next photo, then stays still.
  const autoPlaying = hasSlides && advances < 1 && !interacted && !reducedMotion && appActive && focused;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    }).catch(() => {
      // Keep automatic motion off when the system preference is unavailable.
    });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    const activity = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => {
      mounted = false;
      motion?.remove();
      activity?.remove();
    };
  }, []);

  const goToPhoto = useCallback((index: number, animated = true) => {
    targetRef.current = index;
    selectedRef.current = index;
    setSelected(index);
    gallery.current?.scrollTo({ x: width * index, animated: animated && !reducedMotion });
  }, [reducedMotion, width]);

  useLayoutEffect(() => {
    targetRef.current = selectedRef.current;
    gallery.current?.scrollTo({ x: width * selectedRef.current, animated: false });
  }, [width]);

  useEffect(() => {
    if (!autoPlaying || width === 0) return;
    const timer = setTimeout(() => {
      goToPhoto((selectedRef.current + 1) % photos.length);
      setAdvances((count) => count + 1);
    }, 4000);
    return () => clearTimeout(timer);
  }, [advances, autoPlaying, goToPhoto, photos.length, width]);

  const pause = () => {
    targetRef.current = null;
    setInteracted(true);
  };
  const selectPhoto = (index: number) => {
    pause();
    goToPhoto(index);
  };
  const trackScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const offset = event.nativeEvent.contentOffset.x;
    // Intermediate smooth-scroll frames must not replace a chosen destination,
    // particularly when a device rotates before the animation has finished.
    if (targetRef.current !== null) {
      if (Math.abs(offset - targetRef.current * width) > 2) return;
      targetRef.current = null;
    }
    const index = Math.max(0, Math.min(photos.length - 1, Math.round(offset / width)));
    if (index !== selectedRef.current) {
      selectedRef.current = index;
      setSelected(index);
    }
  };
  const webInteractionProps = process.env.EXPO_OS === 'web' ? { onWheel: pause } : {};

  const thumbWidth = (width - 24 - 3 * 8) / 4;
  const showThumbs = !compact && hasSlides;

  // Compact galleries sit inside listing cards with dots; the hero fills the top of the stay
  // page, under the status bar, with a counter and a row of thumbnails.
  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    style={[{ overflow: 'hidden', backgroundColor: colors.stone }, compact ? { aspectRatio: 1.7 } : { height: width * 0.92 + topInset }]}>
    {width > 0 ? <ScrollView {...webInteractionProps} ref={gallery} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
      onScroll={trackScroll} scrollEventThrottle={16} onMomentumScrollEnd={trackScroll}
      onScrollBeginDrag={pause} onTouchStart={pause} onPointerDown={pause}
      style={{ flex: 1 }}>
      {photos.map((photo, index) => onOpen ? <Pressable key={index} onPress={onOpen} onPressIn={pause}
        accessibilityRole="button" accessibilityLabel={`View ${stay.name}, photo ${index + 1} of ${photos.length}`}
        style={{ width, height: '100%' }}>
        <Image source={photo} contentFit="cover" cachePolicy="memory-disk" transition={150} recyclingKey={`${stay.id}-${index}`} style={{ width: '100%', height: '100%' }} accessible={false} />
      </Pressable> : <Image key={index} source={photo} contentFit="cover" cachePolicy="memory-disk" transition={150} style={{ width, height: '100%' }}
        accessibilityLabel={`${stay.name}, photo ${index + 1} of ${photos.length}`} />)}
    </ScrollView> : null}

    {!compact ? <>
      <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: topInset + 72 }} />
      {showThumbs ? <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.42)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }} /> : null}
      <View pointerEvents="none" style={{ position: 'absolute', right: 14, bottom: showThumbs ? 86 : 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 9, borderCurve: 'continuous', paddingHorizontal: 10, paddingVertical: 6 }}>
        <Icon name="image" size={14} color={colors.white} />
        <Text accessibilityLabel={`Photo ${selected + 1} of ${photos.length}`} style={{ fontFamily: fonts.semibold, color: colors.white, fontSize: 13, fontVariant: ['tabular-nums'] }}>{selected + 1}/{photos.length}</Text>
      </View>
      {showThumbs && width > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ position: 'absolute', left: 0, right: 0, bottom: 12 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {photos.map((photo, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Show photo ${index + 1} of ${stay.name}`}
          accessibilityState={{ selected: selected === index }} onPress={() => selectPhoto(index)}
          style={({ pressed }) => ({ width: thumbWidth, height: 62, borderRadius: 10, borderCurve: 'continuous', overflow: 'hidden', borderWidth: 2, borderColor: selected === index ? colors.white : 'rgba(255,255,255,0.25)', opacity: pressed ? 0.75 : 1 })}>
          <Image source={photo} contentFit="cover" cachePolicy="memory-disk" style={{ width: '100%', height: '100%' }} accessible={false} />
        </Pressable>)}
      </ScrollView> : null}
    </> : null}

    {compact && hasSlides ? <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
      {/* Position only: the whole card is one button, so photos change by swiping. */}
      {photos.map((_, index) => <View key={index} style={{ width: selected === index ? 8 : 6, height: selected === index ? 8 : 6, borderRadius: 4, alignSelf: 'center', backgroundColor: selected === index ? colors.white : 'rgba(255,255,255,0.6)', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />)}
    </View> : null}
  </View>;
}

export function StayGallery(props: GalleryProps) {
  return <Gallery key={props.stay.id} {...props} />;
}
