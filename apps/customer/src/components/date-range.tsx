import { useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { getTodayInKolkata, parseDateOnly } from '@vagago/domain';
import { AppText, Heading } from '@/components/ui';
import { Icon } from '@/components/icon';
import { colors, fonts } from '@/theme';

type DateField = 'checkIn' | 'checkOut';
type DateRangeProps = {
  checkIn: string;
  checkOut: string;
  onChange: (patch: { checkIn?: string; checkOut?: string }) => void;
  errors?: Record<string, string>;
};

const dayMilliseconds = 86_400_000;
const fields: { key: DateField; label: string }[] = [
  { key: 'checkIn', label: 'Arrival' },
  { key: 'checkOut', label: 'Departure' },
];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const shortDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
});
const fullDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});
const monthDate = new Intl.DateTimeFormat('en-GB', {
  month: 'long', year: 'numeric', timeZone: 'UTC',
});

function displayDate(value: string) {
  const parsed = parseDateOnly(value);
  return parsed ? shortDate.format(new Date(parsed.epochDay * dayMilliseconds)) : 'Choose date';
}

export function DateRange({ checkIn, checkOut, onChange, errors = {} }: DateRangeProps) {
  const today = getTodayInKolkata();
  const todayParts = parseDateOnly(today)!;
  const minMonth = todayParts.year * 12 + todayParts.month - 1;
  const maxMonth = minMonth + 24;
  const finalDay = Math.min(todayParts.day, new Date(Date.UTC(todayParts.year + 2, todayParts.month, 0)).getUTCDate());
  const lastDate = new Date(Date.UTC(todayParts.year + 2, todayParts.month - 1, finalDay)).toISOString().slice(0, 10);
  const clampMonth = (value: number) => Math.max(minMonth, Math.min(maxMonth, value));
  const monthFor = (value: string) => {
    const parts = parseDateOnly(value);
    return parts ? clampMonth(parts.year * 12 + parts.month - 1) : minMonth;
  };
  const [activeField, setActiveField] = useState<DateField | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => monthFor(checkIn));
  const cursor = clampMonth(visibleMonth);
  const year = Math.floor(cursor / 12);
  const month = cursor % 12;
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const hasRange = Boolean(parseDateOnly(checkIn) && parseDateOnly(checkOut) && checkOut > checkIn);

  function openField(field: DateField) {
    if (activeField === field) {
      setActiveField(null);
      return;
    }
    setVisibleMonth(monthFor(field === 'checkIn' ? checkIn : checkOut));
    setActiveField(field);
  }

  function chooseDate(value: string) {
    if (!activeField || value < today || value > lastDate) return;
    onChange({ [activeField]: value });
    if (activeField === 'checkIn') {
      setActiveField('checkOut');
      AccessibilityInfo.announceForAccessibility('Arrival selected. Choose your departure date.');
    } else {
      setActiveField(null);
      AccessibilityInfo.announceForAccessibility('Departure selected.');
    }
  }

  return <View style={{ gap: 12 }}>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {fields.map(({ key, label }) => <View key={key} style={{ flex: 1, gap: 6 }}>
        <Pressable onPress={() => openField(key)} accessibilityRole="button"
          accessibilityLabel={`${label}, ${displayDate(key === 'checkIn' ? checkIn : checkOut)}`}
          accessibilityHint="Opens the date calendar"
          accessibilityState={{ expanded: activeField === key }}
          style={({ pressed }) => ({ minHeight: 84, padding: 12, gap: 6, borderWidth: 1,
            borderColor: errors[key] ? colors.error : activeField === key ? colors.pine : colors.stone,
            backgroundColor: activeField === key ? colors.meadow : colors.white,
            borderRadius: 13, borderCurve: 'continuous', opacity: pressed ? 0.8 : 1 })}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Icon name="calendar" size={15} color={colors.fern} />
            <AppText style={{ fontSize: 11, lineHeight: 18, color: colors.fern }}>{label}</AppText>
          </View>
          <AppText style={{ fontSize: 13, lineHeight: 20, fontFamily: fonts.semibold }}>{displayDate(key === 'checkIn' ? checkIn : checkOut)}</AppText>
        </Pressable>
        {errors[key] ? <Text selectable accessibilityRole="alert" accessibilityLiveRegion="polite"
          style={{ color: colors.error, fontFamily: fonts.regular, fontSize: 11, lineHeight: 17 }}>{errors[key]}</Text> : null}
      </View>)}
    </View>

    {activeField ? <View style={{ gap: 12, paddingVertical: 14, borderWidth: 1, borderColor: colors.stone, backgroundColor: colors.white, borderRadius: 16 }}>
      <View style={{ paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <AppText style={{ fontSize: 11, color: colors.fern }}>{activeField === 'checkIn' ? 'Choose arrival' : 'Choose departure'}</AppText>
          <Heading size={16}>{monthDate.format(firstOfMonth)}</Heading>
        </View>
        {[-1, 1].map(direction => {
          const disabled = direction === -1 ? cursor === minMonth : cursor === maxMonth;
          return <Pressable key={direction} accessibilityRole="button" accessibilityLabel={direction === -1 ? 'Previous month' : 'Next month'}
            accessibilityState={{ disabled }} disabled={disabled} onPress={() => setVisibleMonth(clampMonth(cursor + direction))}
            style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
              backgroundColor: colors.mist, opacity: disabled ? 0.3 : pressed ? 0.7 : 1 })}>
            <View style={{ transform: [{ rotate: direction === -1 ? '180deg' : '0deg' }] }}><Icon name="chevron" size={16} /></View>
          </Pressable>;
        })}
      </View>
      <View style={{ gap: 5, paddingHorizontal: 3 }}>
        <View style={{ flexDirection: 'row' }}>
          {weekdays.map(day => <View key={day} style={{ width: '14.285714%', alignItems: 'center' }}>
            <AppText style={{ fontSize: 10, color: colors.fern }}>{day}</AppText>
          </View>)}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {Array.from({ length: cellCount }, (_, index) => {
            const day = index - firstWeekday + 1;
            if (day < 1 || day > daysInMonth) return <View key={`blank-${index}`} style={{ width: '14.285714%', height: 44 }} />;
            const date = new Date(Date.UTC(year, month, day));
            const value = date.toISOString().slice(0, 10);
            const disabled = value < today || value > lastDate;
            const selected = value === checkIn || value === checkOut;
            const withinRange = hasRange && value > checkIn && value < checkOut;
            return <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Choose ${fullDate.format(date)}`}
              accessibilityHint={value === checkIn ? 'Current arrival date' : value === checkOut ? 'Current departure date' : undefined}
              accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => chooseDate(value)}
              style={({ pressed }) => ({ width: '14.285714%', minHeight: 44, alignItems: 'center', justifyContent: 'center',
                borderRadius: selected ? 22 : 0, backgroundColor: selected ? colors.pine : withinRange ? colors.meadow : 'transparent',
                opacity: disabled ? 0.3 : pressed ? 0.65 : 1 })}>
              <AppText style={{ fontSize: 12, lineHeight: 20, fontFamily: selected || value === today ? fonts.bold : fonts.regular,
                color: selected ? colors.white : colors.ink, textDecorationLine: value === today && !selected ? 'underline' : 'none' }}>{day}</AppText>
            </Pressable>;
          })}
        </View>
      </View>
      <AppText style={{ paddingHorizontal: 14, color: colors.fern, fontSize: 10, lineHeight: 16 }}>Choose dates for your trip. Availability is not yet checked.</AppText>
    </View> : null}
  </View>;
}
