import * as Notifications from 'expo-notifications';

const REMINDER_ID = 'daily-selfie';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Schedules (or reschedules) the local "time for your selfie" reminder. */
export async function scheduleDailyReminder(hour = 12, minute = 0): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return false;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: 'PhotoDay 📸', body: "C'est l'heure de ton selfie du jour !" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  return true;
}
