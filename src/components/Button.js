import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { COLORS, SPACING, BORDER_RADIUS } from '../constants'

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button]
    
    // Variants
    if (variant === 'primary') {
      baseStyle.push(styles.primary)
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondary)
    } else if (variant === 'outline') {
      baseStyle.push(styles.outline)
    } else if (variant === 'ghost') {
      baseStyle.push(styles.ghost)
    }

    // Sizes
    if (size === 'small') {
      baseStyle.push(styles.small)
    } else if (size === 'large') {
      baseStyle.push(styles.large)
    }

    // States
    if (disabled || loading) {
      baseStyle.push(styles.disabled)
    }

    return baseStyle
  }

  const getTextStyle = () => {
    const baseStyle = [styles.text]
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryText)
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryText)
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineText)
    } else if (variant === 'ghost') {
      baseStyle.push(styles.ghostText)
    }

    if (size === 'small') {
      baseStyle.push(styles.smallText)
    } else if (size === 'large') {
      baseStyle.push(styles.largeText)
    }

    return baseStyle
  }

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? COLORS.text.white : COLORS.primary} 
          size="small"
        />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48
  },
  
  // Variants
  primary: {
    backgroundColor: COLORS.primary
  },
  secondary: {
    backgroundColor: COLORS.secondary
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  ghost: {
    backgroundColor: 'transparent'
  },

  // Sizes
  small: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    minHeight: 36
  },
  large: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56
  },

  // States
  disabled: {
    opacity: 0.5
  },

  // Text styles
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  primaryText: {
    color: COLORS.text.white
  },
  secondaryText: {
    color: COLORS.text.white
  },
  outlineText: {
    color: COLORS.primary
  },
  ghostText: {
    color: COLORS.primary
  },
  smallText: {
    fontSize: 14
  },
  largeText: {
    fontSize: 18
  }
})

export default Button
