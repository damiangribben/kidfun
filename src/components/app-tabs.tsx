import { NativeTabs } from 'expo-router/native-tabs';

/**
 * Native bottom tabs with Android's default look and behaviour: no custom
 * colours, fonts or ripple, so the bar follows the platform's Material styling.
 */
export default function AppTabs() {
  return (
    <NativeTabs>
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
