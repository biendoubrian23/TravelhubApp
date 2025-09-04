import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

export default StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 15,
    marginHorizontal: 20,
    letterSpacing: -0.3,
  },
  scrollContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#3B82F6',
    transform: [{ scale: 1.2 }],
  },
});
