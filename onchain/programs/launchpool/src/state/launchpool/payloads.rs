use anchor_lang::prelude::Pubkey;
use utilities::math::Q64_128;

#[cfg_attr(test, derive(Clone))]
pub(crate) struct LaunchpoolSnapshot {
    reward_per_token: Q64_128,
    launchpool: Pubkey,
    min_position_size: u64,
    max_position_size: u64
}
impl LaunchpoolSnapshot{
    pub(super) fn new(reward_per_token: Q64_128, launchpool: Pubkey, min_position_size: u64, max_position_size: u64) -> Self {
        Self{
            reward_per_token,
            launchpool,
            min_position_size,
            max_position_size
        }
    }
    #[cfg(test)]
    pub(crate) fn new_test(reward_per_token: Q64_128, launchpool: Pubkey, min_position_size: u64, max_position_size: u64) -> Self {
        Self::new(reward_per_token, launchpool, min_position_size, max_position_size)
    }
    #[inline]
    pub(crate) fn reward_per_token(&self) -> Q64_128 {
        self.reward_per_token
    }

    #[inline]
    pub(crate) fn launchpool(&self) -> &Pubkey {
        &self.launchpool
    }

    #[inline]
    pub(crate) fn min_position_size(&self) -> u64 {
        self.min_position_size
    }

    #[inline]
    pub(crate) fn max_position_size(&self) -> u64 {
        self.max_position_size
    }
}
pub(crate) struct LaunchPayload{
    reward_rate: Q64_128,
    start_timestamp: u64,
    end_timestamp: u64,
}
impl LaunchPayload{
    pub(super) fn new(reward_rate: Q64_128, start_timestamp: u64, end_timestamp: u64) -> Self {
        Self{
            reward_rate,
            start_timestamp,
            end_timestamp
        }
    }

    #[inline]
    pub(crate) fn reward_rate(&self) -> Q64_128 {
        self.reward_rate
    }

    #[inline]
    pub(crate) fn start_timestamp(&self) -> u64 {
        self.start_timestamp
    }

    #[inline]
    pub(crate) fn end_timestamp(&self) -> u64 {
        self.end_timestamp
    }
}
pub(crate) struct CollectProtocolRewardPayload{
    protocol_reward_amount: u64
}
impl CollectProtocolRewardPayload{
    pub(super) fn new(protocol_reward_amount: u64) -> Self {
        Self{
            protocol_reward_amount
        }
    }

    #[inline]
    pub(crate) fn protocol_reward_amount(&self) -> u64{
        self.protocol_reward_amount
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use utilities::math::Q64_128;

    #[test]
    fn test_launchpool_snapshot_getters() {
        let reward_per_token = Q64_128::from_u64(123);
        let launchpool = Pubkey::new_unique();
        let min = 10;
        let max = 1000;

        let snapshot = LaunchpoolSnapshot::new(reward_per_token, launchpool, min, max);

        assert_eq!(snapshot.reward_per_token().as_u64(), 123);
        assert_eq!(*snapshot.launchpool(), launchpool);
        assert_eq!(snapshot.min_position_size(), min);
        assert_eq!(snapshot.max_position_size(), max);
    }

    #[test]
    fn test_launch_payload_getters() {
        let reward_rate = Q64_128::from_u64(555);
        let start = 1_000_000;
        let end = 2_000_000;

        let payload = LaunchPayload::new(reward_rate, start, end);

        assert_eq!(payload.reward_rate().as_u64(), 555);
        assert_eq!(payload.start_timestamp(), start);
        assert_eq!(payload.end_timestamp(), end);
    }

    #[test]
    fn test_collect_protocol_reward_payload_getter() {
        let amount = 999_999;
        let payload = CollectProtocolRewardPayload::new(amount);

        assert_eq!(payload.protocol_reward_amount(), amount);
    }
}
