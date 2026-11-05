import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Icon, type IconName } from '@/components/icon';
import { ease, Reveal } from '@/components/motion';
import { openDirections } from '@/components/directions';
import { formatDrive, formatKm, nearbyAttractions, useAttractions } from '@/data/attractions';
import { faqs } from '@/data/faq';
import { amenityArt, placePhotoUrl } from '@/lib/site';
import { colors, fonts } from '@/theme';
import type { Stay } from '@/types';

const vagamonTown = { latitude: 9.6863, longitude: 76.9052 };

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16 }}>
    <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 19, color: colors.ink, letterSpacing: -0.3 }}>{children}</Text>
    {action}
  </View>;
}

// Rounded photo tiles that pop in one after another, like the reference's popular row.
export function PlacesRow({ delay = 0 }: { delay?: number }) {
  const places = nearbyAttractions(vagamonTown, useAttractions());
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
    {places.map((place, index) => {
      const photo = placePhotoUrl(place.id);
      return <Reveal key={place.id} from="fade" duration={420} delay={delay + index * 90}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${place.name}, ${formatKm(place.roadKm)} from Vagamon town. Open directions`}
          onPress={() => void openDirections(place.coordinates)} style={({ pressed }) => ({ width: 84, gap: 6, opacity: pressed ? 0.7 : 1 })}>
          {photo ? <Image source={{ uri: photo }} contentFit="cover" cachePolicy="memory-disk" transition={200} accessible={false}
            style={{ width: 84, height: 84, borderRadius: 20, backgroundColor: colors.stone }} />
            : <View style={{ width: 84, height: 84, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={26} color="rgba(255,255,255,0.8)" /></View>}
          <View>
            <Text numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.ink }}>{place.name}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.fern }}>{formatKm(place.roadKm)} · {formatDrive(place.driveMinutes)}</Text>
          </View>
        </Pressable>
      </Reveal>;
    })}
  </ScrollView>;
}

const promises: { icon: IconName; label: string }[] = [
  { icon: 'cash', label: 'Pay at the stay, no advance' },
  { icon: 'lock', label: 'Exact address right after booking' },
  { icon: 'calendar', label: 'Free cancellation before check-in' },
];

export function WhyVagaGo({ stays }: { stays: Stay[] }) {
  // The amenities most often found at live stays, with how many stays offer each.
  const counts = new Map<string, number>();
  stays.forEach((stay) => stay.amenities.forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1)));
  const popular = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
  return <View style={{ gap: 14 }}>
    <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.ink, letterSpacing: -0.5, paddingHorizontal: 16 }}>
      Why book with <Text style={{ color: colors.pine }}>VagaGo</Text>
    </Text>
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      {promises.map((item) => <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.meadow, alignItems: 'center', justifyContent: 'center' }}><Icon name={item.icon} size={19} /></View>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, flex: 1 }}>{item.label}</Text>
      </View>)}
    </View>
    {popular.length ? <>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.fern, paddingHorizontal: 16, marginTop: 6 }}>Popular at our stays</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {popular.map(([name]) => {
          const art = amenityArt(name);
          return art.photo
            ? <View key={name} style={{ width: 150, height: 170, borderRadius: 24, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: colors.stone }}>
              <Image source={{ uri: art.uri }} contentFit="cover" cachePolicy="memory-disk" transition={200} accessible={false} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']} locations={[0.4, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
                <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.white }}>{name}</Text>
              </View>
            </View>
            : <View key={name} style={{ width: 150, height: 170, borderRadius: 24, borderCurve: 'continuous', backgroundColor: '#F1F2F1', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
              <Image source={{ uri: art.uri }} contentFit="contain" cachePolicy="memory-disk" accessible={false} style={{ width: 108, height: 86 }} />
              <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginTop: 8 }}>{name}</Text>
            </View>;
        })}
      </ScrollView>
    </> : null}
  </View>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(open ? '-90deg' : '90deg', { duration: 260, easing: ease }) }] }));
  return <Animated.View layout={LinearTransition.duration(280).easing(ease)} style={{ borderBottomWidth: 1, borderColor: colors.stone, overflow: 'hidden' }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}
      style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.ink }}>{q}</Text>
      <Animated.View style={chevron}><Icon name="chevron" size={16} color={colors.fern} /></Animated.View>
    </Pressable>
    {open ? <Animated.Text entering={FadeIn.duration(220)} style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.fern, paddingBottom: 16 }}>{a}</Animated.Text> : null}
  </Animated.View>;
}

export function Faq({ title = true }: { title?: boolean }) {
  return <View style={{ gap: 6 }}>
    {title ? <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.ink, letterSpacing: -0.4, paddingHorizontal: 16 }}>Questions and answers</Text> : null}
    <Animated.View layout={LinearTransition.duration(280).easing(ease)} style={{ paddingHorizontal: 16, borderTopWidth: 1, borderColor: colors.stone, marginTop: 6 }}>
      {faqs.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
    </Animated.View>
  </View>;
}
