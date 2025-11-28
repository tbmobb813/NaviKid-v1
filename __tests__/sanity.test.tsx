import React from 'react';
import { View, Text } from 'react-native';
import { simpleRender } from './test-utils';

test('sanity view', () => {
  const { getByText } = render(
    <View>
      <Text>ok</Text>
    </View>,
  );

  expect(getByText('ok')).toBeTruthy();
});
