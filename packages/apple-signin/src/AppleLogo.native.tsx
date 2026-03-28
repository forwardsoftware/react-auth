import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const APPLE_PATH =
  'M15.5 14.7c-.4.9-.6 1.3-1.1 2.1-.7 1.1-1.7 2.5-2.9 2.5-1.1 0-1.4-.7-2.9-.7-1.5 0-1.9.7-3 .7-1.2 0-2.1-1.2-2.8-2.3C1.2 14.6.5 11.4 1.6 9.2c.8-1.5 2.1-2.4 3.5-2.4 1.3 0 2.2.8 3.2.8 1 0 1.7-.8 3.1-.8 1.2 0 2.4.7 3.2 1.8-2.8 1.5-2.4 5.5.3 6.7l-.4-.6zM11.3 4.5c.5-.7.9-1.6.8-2.5-.8.1-1.7.5-2.3 1.2-.5.6-1 1.5-.8 2.4.9 0 1.7-.4 2.3-1.1z';

export function AppleLogo({ color }: { color: string }) {
  return (
    <View style={{ marginRight: 8 }}>
      <Svg viewBox="0 0 17 20" width={16} height={20} fill={color}>
        <Path d={APPLE_PATH} />
      </Svg>
    </View>
  );
}
