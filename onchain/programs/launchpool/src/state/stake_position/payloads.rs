use utilities::math::Q64_128;

#[cfg_attr(test, derive(Clone, Default))]
pub(crate) struct OpenPositionPayload {
    amount: u64,
}
impl OpenPositionPayload {
    pub(super) fn new(amount: u64) -> Self {
        Self { amount }
    }
    #[cfg(test)]
    pub(crate) fn new_test(amount: u64) -> Self {
        Self::new(amount)
    }
    #[inline]
    pub(crate) fn amount(&self) -> u64 {
        self.amount
    }
}

#[cfg_attr(test, derive(Clone, Default))]
pub(crate) struct IncreasePositionPayload {
    pending: Q64_128,
    increase_amount: u64,
}
impl IncreasePositionPayload {
    pub(super) fn new(increase_amount: u64, pending: Q64_128) -> Self {
        Self {
            increase_amount,
            pending
        }
    }
    #[cfg(test)]
    pub(crate) fn new_test(increase_amount: u64, pending: Q64_128) -> Self {
        Self::new(increase_amount, pending)
    }
    #[inline]
    pub(crate) fn pending(&self) -> Q64_128 {
        self.pending
    }

    #[inline]
    pub(crate) fn increase_amount(&self) -> u64 {
        self.increase_amount
    }
}

#[cfg_attr(test, derive(Clone, Default))]
pub(crate) struct ClosePositionPayload {
    pending: Q64_128,
    stake_amount: u64,
    reward_earned: Q64_128,
}
impl ClosePositionPayload {
    pub(super) fn new(stake_amount: u64, pending: Q64_128, reward_earned: Q64_128) -> Self {
        Self {
            stake_amount,
            pending,
            reward_earned
        }
    }
    #[cfg(test)]
    pub(crate) fn new_test(stake_amount: u64, pending: Q64_128, reward_earned: Q64_128) -> Self {
        Self::new(stake_amount, pending, reward_earned)
    }
    #[inline]
    pub(crate) fn pending(&self) -> Q64_128 {
        self.pending
    }

    #[inline]
    pub(crate) fn stake_amount(&self) -> u64 {
        self.stake_amount
    }

    #[inline]
    pub(crate) fn reward_earned(&self) -> Q64_128 {
        self.reward_earned
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_open_position_payload() {
        let amount = 42;
        let payload = OpenPositionPayload::new(amount);
        assert_eq!(payload.amount(), amount);
    }

    #[test]
    fn test_increase_position_payload() {
        let increase_amount = 100;
        let pending = Q64_128::from_u64(25);
        let payload = IncreasePositionPayload::new(increase_amount, pending);
        assert_eq!(payload.increase_amount(), increase_amount);
        assert_eq!(payload.pending(), pending);
    }

    #[test]
    fn test_close_position_payload() {
        let stake_amount = 150;
        let pending = Q64_128::from_u64(50);
        let reward_earned = Q64_128::from_u64(75);
        let payload = ClosePositionPayload::new(stake_amount, pending, reward_earned);
        assert_eq!(payload.stake_amount(), stake_amount);
        assert_eq!(payload.pending(), pending);
        assert_eq!(payload.reward_earned(), reward_earned);
    }
}