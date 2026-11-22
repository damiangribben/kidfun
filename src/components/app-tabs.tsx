import { NativeTabs } from 'expo-router/native-tabs';

import { Colors, Palette } from '@/constants/theme';

// Android's native bottom bar with Kidfun's colours, as designed in Pen
// (Tab bar states). Font and switching animation stay Android's defaults.
const UNSELECTED = '#49454F';
const SELECTED = '#1D192B';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Colors.light.background}
      indicatorColor={Palette.yellow}
      rippleColor={`${Palette.yellow}80`}
      iconColor={{ default: UNSELECTED, selected: SELECTED }}
      labelStyle={{ default: { color: UNSELECTED }, selected: { color: SELECTED } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Play</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="lightbulb.fill" md="lightbulb" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bookmark.fill" md="bookmarks" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="toys">
        <NativeTabs.Trigger.Label>Toys</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="teddybear.fill" md="toys" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="family">
        <NativeTabs.Trigger.Label>Family</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="family_restroom" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
