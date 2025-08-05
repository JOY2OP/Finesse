import { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native'

export default function aa() {
  const [text, setText] = useState(null);
  console.log(text);
   const onPress = () => console.log("===text====",text);
  return (
    <View>
      setu screen
      <TextInput
          // style={styles.input}
          onChangeText={setText}
          value={text}
      />  
      <TouchableOpacity onPress={onPress}>
        <Text>Press Here</Text>
      </TouchableOpacity>
    </View>
  )
}
