import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icon';
import { sortOptions, type SortId } from '@/data/search';
import { colors, fonts } from '@/theme';

// Opens over everything (tab bar included) so the list underneath never moves.
export function SortSheet({ visible, value, onChange, onClose }: { visible: boolean; value: SortId; onChange: (value: SortId) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close sort options" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
      <Animated.View entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic))} accessibilityViewIsModal
        style={{ backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderCurve: 'continuous', paddingTop: 8, paddingBottom: Math.max(insets.bottom, 16) }}>
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.stone }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8, paddingTop: 6 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 19, color: colors.ink }}>Sort by</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={20} color={colors.ink} /></Pressable>
        </View>
        {sortOptions.map((option) => {
          const selected = option.id === value;
          return <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={option.label}
            onPress={() => { onChange(option.id); onClose(); }}
            style={({ pressed }) => ({ minHeight: 54, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: pressed ? colors.canvas : colors.white })}>
            <Text style={{ fontFamily: selected ? fonts.semibold : fonts.regular, fontSize: 15, color: colors.ink }}>{option.label}</Text>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: selected ? 7 : 1.5, borderColor: selected ? colors.pine : colors.fern }} />
          </Pressable>;
        })}
      </Animated.View>
    </View>
  </Modal>;
}
