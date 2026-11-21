import { NativeTabs } from 'expo-router/native-tabs';

import { Colors, Fonts, Palette } from '@/constants/theme';

/** Native bottom tabs: white bar, yellow highlight on the selected tab, Fredoka labels. */
export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Palette.white}
      indicatorColor={Palette.yellow}
      iconColor={{ default: Colors.light.textSecondary, selected: Palette.ink }}
      labelStyle={{
        default: { color: Colors.light.textSecondary, fontFamily: Fonts.display, fontSize: 12 },
        selected: { color: Palette.ink, fontFamily: Fonts.display, fontSize: 12 },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>PLAY</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="lightbulb.fill" md="lightbulb" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Label>LIBRARY</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bookmark.fill" md="bookmarks" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="toys">
        <NativeTabs.Trigger.Label>TOYS</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="teddybear.fill" md="toys" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="family">
        <NativeTabs.Trigger.Label>FAMILY</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="family_restroom" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
