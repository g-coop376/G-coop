import Share from 'react-native-share';

export async function shareFile(url: string, title: string) {
  await Share.open({
    title,
    url: `file://${url}`,
    failOnCancel: false,
  });
}
