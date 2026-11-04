import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { colors, fonts } from '@/theme';
import type { Stay } from '@/types';

type GalleryProps = { stay: Stay; compact?: boolean; onOpen?: () => void };

function Gallery({ stay, compact = false, onOpen }: GalleryProps) {
  const photos = stay.gallery.length ? stay.gallery : [stay.image];
  const gallery = useRef<ScrollView>(null);
  const selectedRef = useRef(0);
  const targetRef = useRef<number | null>(null);
  const [selected, setSelected] = useState(0);
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

  // Compact galleries run edge to edge in the Explore feed, without thumbnails.
  return <View style={{ gap: 10 }}>
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ aspectRatio: compact ? 1.15 : 1.3, overflow: 'hidden', backgroundColor: colors.stone }}>
      {width > 0 ? <ScrollView {...webInteractionProps} ref={gallery} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={trackScroll} scrollEventThrottle={16} onMomentumScrollEnd={trackScroll}
        onScrollBeginDrag={pause} onTouchStart={pause} onPointerDown={pause}
        style={{ flex: 1 }}>
        {photos.map((photo, index) => onOpen ? <Pressable key={index} onPress={onOpen} onPressIn={pause}
          accessibilityRole="button" accessibilityLabel={`View ${stay.name}, photo ${index + 1} of ${photos.length}`}
          style={{ width, height: '100%' }}>
          <Image source={photo} contentFit="cover" style={{ width: '100%', height: '100%' }} accessible={false} />
        </Pressable> : <Image key={index} source={photo} contentFit="cover" style={{ width, height: '100%' }}
          accessibilityLabel={`${stay.name}, representative photo ${index + 1} of ${photos.length}`} />)}
      </ScrollView> : null}

      {!compact ? <View pointerEvents="none" style={{ position: 'absolute', right: 12, bottom: 15, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 }}>
        <Text accessibilityLabel={`Photo ${selected + 1} of ${photos.length}`} style={{ fontFamily: fonts.semibold, color: colors.white, fontSize: 11, fontVariant: ['tabular-nums'] }}>{selected + 1}/{photos.length}</Text>
      </View> : null}
      {hasSlides ? <View style={{ position: 'absolute', bottom: 5, alignSelf: 'center', flexDirection: 'row' }}>
        {photos.map((_, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`${stay.name}: photo ${index + 1}`}
          accessibilityState={{ selected: selected === index }} onPress={() => selectPhoto(index)}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: selected === index ? 7 : 5, height: selected === index ? 7 : 5, borderRadius: 4, backgroundColor: selected === index ? colors.white : 'rgba(255,255,255,0.65)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </Pressable>)}
      </View> : null}
    </View>

    {!compact ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      {photos.map((photo, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Show photo ${index + 1} of ${stay.name}`}
        accessibilityState={{ selected: selected === index }} onPress={() => selectPhoto(index)}
        style={({ pressed }) => ({ width: 74, height: 58, padding: 3, borderWidth: 1.5, borderColor: selected === index ? colors.pine : colors.stone, borderRadius: 10, opacity: pressed ? 0.7 : 1 })}>
        <Image source={photo} contentFit="cover" style={{ width: '100%', height: '100%', borderRadius: 6 }} accessible={false} />
      </Pressable>)}
    </ScrollView> : null}
  </View>;
}

export function StayGallery(props: GalleryProps) {
  return <Gallery key={props.stay.id} {...props} />;
}
