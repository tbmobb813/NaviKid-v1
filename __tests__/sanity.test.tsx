import React from 'react';
import { View, Text } from 'react-native';
import { render } from '@testing-library/react-native';

test('sanity view', () => {
  const { getByText } = render(
    <View>
      <Text>ok</Text>
    </View>,
  );

  expect(getByText('ok')).toBeTruthy();
});
