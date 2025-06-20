/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';
import { getU192Decoder, getU192Encoder, type U192, type U192Args } from '.';

/**
 * Represents a fixed-point number with 64 integer bits and 128 fractional bits.
 *
 * The `Q64_128` type is useful for high-precision arithmetic where fractional values
 * need to be represented without losing precision. Internally, it uses a 192-bit
 * unsigned integer (`U192`) to store the value, where the most significant 64 bits
 * represent the integer part, and the least significant 128 bits represent the fractional part.
 *
 * This type provides utilities for fixed-point arithmetic, conversions from primitive types,
 * and accessing the integer and fractional components of the value.
 */

export type Q64128 = {
  /** The internal representation of the fixed-point value as a 192-bit unsigned integer. */
  value: U192;
};

export type Q64128Args = {
  /** The internal representation of the fixed-point value as a 192-bit unsigned integer. */
  value: U192Args;
};

export function getQ64128Encoder(): Encoder<Q64128Args> {
  return getStructEncoder([['value', getU192Encoder()]]);
}

export function getQ64128Decoder(): Decoder<Q64128> {
  return getStructDecoder([['value', getU192Decoder()]]);
}

export function getQ64128Codec(): Codec<Q64128Args, Q64128> {
  return combineCodec(getQ64128Encoder(), getQ64128Decoder());
}
