import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './styles';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_MARGIN = 10;

const ModernCarousel = ({ 
  title, 
  data, 
  renderItem, 
  autoScroll = true,
  showDots = true,
  cardStyle = {},
  titleStyle = {},
  containerStyle = {},
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoScroll && data.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % data.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * (CARD_WIDTH + CARD_MARGIN * 2),
            animated: true,
          });
          return nextIndex;
        });
      }, 4000);

      return () => clearInterval(timer);
    }
  }, [data.length, autoScroll]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_MARGIN * 2));
    setCurrentIndex(index);
  };

  const renderCard = (item, index) => {
    return (
      <View key={index} style={[styles.cardContainer, cardStyle]}>
        {renderItem(item, index)}
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {title && (
        <Text style={[styles.title, titleStyle]}>{title}</Text>
      )}
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        snapToAlignment="start"
        contentInset={{
          top: 0,
          left: 20,
          bottom: 0,
          right: 20,
        }}
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {data.map((item, index) => renderCard(item, index))}
      </ScrollView>

      {showDots && data.length > 1 && (
        <View style={styles.dotsContainer}>
          {data.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot
              ]}
              onPress={() => {
                setCurrentIndex(index);
                scrollViewRef.current?.scrollTo({
                  x: index * (CARD_WIDTH + CARD_MARGIN * 2),
                  animated: true,
                });
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ModernCarousel;
