use std::cmp::Ordering;
use anchor_lang::{account, require, InitSpace, Key};
use anchor_lang::prelude::*;
use anchor_spl::token_interface;
use utilities::math::Q64_128;
use crate::state::enums::LaunchpoolStatus;
use crate::state::{LaunchpoolsConfig};
use crate::state::launchpool::payloads::{CollectProtocolRewardPayload, LaunchPayload, LaunchpoolSnapshot};
use crate::state::stake_position::payloads::{ClosePositionPayload, IncreasePositionPayload, OpenPositionPayload};
use super::LaunchpoolError;
#[account]
#[derive(InitSpace)]
#[cfg_attr(test, derive(Default))]
pub struct Launchpool {
    reward_vault: Pubkey,
    pub reward_mint: Pubkey,
    launchpools_config: Pubkey,

    start_timestamp: u64,
    end_timestamp: u64,
    last_update_timestamp: u64,

    initial_reward_amount: u64,
    participants_reward_amount: Q64_128,
    protocol_reward_amount: u64,

    protocol_reward_left_to_obtain: u64,
    participants_reward_left_to_obtain: u64,

    staked_amount: u64,
    participants_reward_left_to_distribute: Q64_128,

    reward_rate: Q64_128,
    reward_per_token: Q64_128,

    min_position_size: u64,
    max_position_size: u64,

    status: LaunchpoolStatus,

    bump: [u8; 1],
    reward_vault_bump: [u8; 1],
}


impl Launchpool {
    /// Seed used for generating the PDA.
    pub const SEED: &'static [u8] = b"launchpool";

    /// Seed used for generating the vault PDA.
    pub const VAULT_SEED: &'static [u8] = b"vault";

    pub fn seeds(&self) -> [&[u8]; 3] {
        [Self::SEED, self.reward_mint.as_ref(), self.bump.as_ref()]
    }

    #[inline]
    pub fn status(&self) -> LaunchpoolStatus {
        self.status
    }
    #[inline]
    pub fn bump(&self) -> u8 {
        self.bump[0]
    }
    #[inline]
    pub fn reward_mint(&self) -> &Pubkey { &self.reward_mint }
    #[inline]
    pub fn reward_vault(&self) -> &Pubkey {
        &self.reward_vault
    }

    #[inline]
    pub fn reward_vault_bump(&self) -> u8 {
        self.reward_vault_bump[0]
    }
    #[inline]
    pub fn launchpools_config(&self) -> &Pubkey {
        &self.launchpools_config
    }

    #[inline]
    pub fn start_timestamp(&self) -> u64 {
        self.start_timestamp
    }

    #[inline]
    pub fn end_timestamp(&self) -> u64 {
        self.end_timestamp
    }

    #[inline]
    pub fn last_update_timestamp(&self) -> u64 {
        self.last_update_timestamp
    }

    #[inline]
    pub fn initial_reward_amount(&self) -> u64 {
        self.initial_reward_amount
    }

    #[inline]
    pub fn protocol_reward_left_to_obtain(&self) -> u64 {
        self.protocol_reward_left_to_obtain
    }

    #[inline]
    pub fn participants_reward_left_to_distribute(&self) -> Q64_128 {
        self.participants_reward_left_to_distribute
    }

    #[inline]
    pub fn participants_reward_left_to_obtain(&self) -> u64 {
        self.participants_reward_left_to_obtain
    }
    #[inline]
    pub fn participants_reward_amount(&self) -> Q64_128 {
        self.participants_reward_amount
    }
    #[inline]
    pub fn protocol_reward_amount(&self) -> u64 {
        self.protocol_reward_amount
    }

    #[inline]
    pub fn reward_rate(&self) -> Q64_128 {
        self.reward_rate
    }

    #[inline]
    pub fn reward_per_token(&self) -> Q64_128 {
        self.reward_per_token
    }

    #[inline]
    pub fn min_position_size(&self) -> u64 {
        self.min_position_size
    }

    #[inline]
    pub fn max_position_size(&self) -> u64 {
        self.max_position_size
    }

    #[inline]
    pub fn staked_amount(&self) -> u64 {
        self.staked_amount
    }

}

impl Launchpool{
    fn calculate_reward_increment(&self, effective_time: u64) -> Result<Q64_128>{
        let elapsed = effective_time.checked_sub(self.last_update_timestamp()).ok_or(LaunchpoolError::EffectiveTimeBeforeLastAccrual)?;
        let reward = Q64_128::from_u64(elapsed)
            .checked_mul(self.reward_rate())
            .ok_or(LaunchpoolError::RewardCalculationOverflow)?;
        Ok(reward.checked_div(Q64_128::from_u64(self.staked_amount())).ok_or(LaunchpoolError::DivisionByZeroDuringRewardCalculation)?)
    }
    fn calculate_reward_rate(&self, duration: u64) -> Result<Q64_128>{
        let reward_rate = self.participants_reward_amount().checked_div(Q64_128::from_u64(duration)).ok_or(LaunchpoolError::RewardRateOverflow)?;
        Ok(reward_rate)
    }
    pub(crate) fn check_active_state(&self, now: u64) -> Result<()> {
        require_eq!(self.status, LaunchpoolStatus::Launched, LaunchpoolError::LaunchpoolNotLaunched);
        require!(self.start_timestamp <= now, LaunchpoolError::LaunchpoolNotStartedYet);
        require!(self.end_timestamp >= now, LaunchpoolError::LaunchpoolAlreadyEnded);
        Ok(())
    }
    pub(crate) fn check_finished_state(&self, now: u64) -> Result<()> {
        require!(self.status == LaunchpoolStatus::Finished || self.status == LaunchpoolStatus::ClaimedProtocolReward, LaunchpoolError::LaunchpoolNotFinished);
        require!(self.end_timestamp < now, LaunchpoolError::LaunchpoolNotEndedYet);
        Ok(())
    }
    pub(crate) fn get_snapshot(launchpool: &Account<Launchpool>) -> LaunchpoolSnapshot {
        LaunchpoolSnapshot::new(launchpool.reward_per_token, launchpool.key(), launchpool.min_position_size, launchpool.max_position_size)
    }
    pub(crate) fn get_launch_payload(&self, now: u64, start_timestamp: u64, duration: u64) -> Result<LaunchPayload>{
        require_eq!(self.status, LaunchpoolStatus::Initialized, LaunchpoolError::LaunchpoolNotInitialized);
        require!(now < start_timestamp, LaunchpoolError::StartTimeInPast);
        Ok(LaunchPayload::new(
            self.calculate_reward_rate(duration)?,
            start_timestamp,
            start_timestamp.checked_add(duration).ok_or(LaunchpoolError::EndTimeOverflow)?,
        ))
    }
    pub(crate) fn get_collect_protocol_reward_payload(&self) -> Result<CollectProtocolRewardPayload>{
        require_eq!(self.status, LaunchpoolStatus::Finished, LaunchpoolError::LaunchpoolNotFinished);
        Ok(CollectProtocolRewardPayload::new(self.protocol_reward_amount))
    }

}
impl Launchpool{
    #[inline(never)]
    pub(crate) fn initialize(
        &mut self,
        initial_reward_amount: u64,
        reward_vault: &AccountInfo,
        reward_mint: &InterfaceAccount<token_interface::Mint>,
        launchpools_config: &Account<LaunchpoolsConfig>,
        bump: u8,
        reward_vault_bump: u8,
    ) -> Result<()>{
        require!(initial_reward_amount > 0, LaunchpoolError::InvalidInitialRewardAmount);
        require_eq!(self.status, LaunchpoolStatus::Uninitialized, LaunchpoolError::LaunchpoolAlreadyInitialized);

        self.status = LaunchpoolStatus::Initialized;

        self.initial_reward_amount = initial_reward_amount;
        self.protocol_reward_amount = (self.initial_reward_amount as u128 * launchpools_config.protocol_reward_share_basis_points() as u128 / 10_000) as u64;
        self.participants_reward_left_to_obtain = self.initial_reward_amount - self.protocol_reward_amount;

        self.participants_reward_left_to_distribute = Q64_128::from_u64(self.participants_reward_left_to_obtain);
        self.participants_reward_amount = self.participants_reward_left_to_distribute;

        self.protocol_reward_left_to_obtain = self.protocol_reward_amount;

        self.min_position_size = launchpools_config.min_position_size();
        self.max_position_size = launchpools_config.max_position_size();
        self.staked_amount = 0;

        self.reward_vault = reward_vault.key();
        self.launchpools_config = launchpools_config.key();
        self.reward_mint = reward_mint.key();

        self.start_timestamp = 0;
        self.end_timestamp = 0;
        self.last_update_timestamp = 0;

        self.bump = [bump];
        self.reward_vault_bump = [reward_vault_bump];

        Ok(())
    }

    #[inline(never)]
    pub(crate) fn accrue_rewards(&mut self, now: u64) -> Result<()> {
        let effective_now = match now.cmp(&self.end_timestamp){
            Ordering::Less => now,
            Ordering::Equal | Ordering::Greater => {
                if self.status == LaunchpoolStatus::Launched{
                    self.status = LaunchpoolStatus::Finished;
                }
                self.end_timestamp
            }
        };
        if self.staked_amount == 0{
            self.last_update_timestamp = effective_now;
            return Ok(());
        }
        match effective_now.cmp(&self.last_update_timestamp){
            Ordering::Less => {
                Err(LaunchpoolError::EffectiveTimeBeforeLastAccrual.into())
            }
            Ordering::Equal => {
                Ok(())
            }
            Ordering::Greater => {
                let reward_increment = self.calculate_reward_increment(effective_now)?;
                self.reward_per_token = self.reward_per_token.checked_add(reward_increment).ok_or(LaunchpoolError::RewardPerTokenOverflow)?;
                self.last_update_timestamp = effective_now;
                Ok(())
            }
        }
    }

    #[inline]
    pub(crate) fn launch(&mut self, payload: LaunchPayload) {
        self.status = LaunchpoolStatus::Launched;
        self.reward_rate = payload.reward_rate();
        self.start_timestamp = payload.start_timestamp();
        self.last_update_timestamp = payload.start_timestamp();
        self.end_timestamp = payload.end_timestamp();
    }

    #[inline(never)]
    pub(crate) fn process_position_open(&mut self, open_position_payload: OpenPositionPayload) -> Result<()>{
        self.staked_amount = self.staked_amount.checked_add(open_position_payload.amount()).ok_or(LaunchpoolError::StakedAmountOverflow)?;
        Ok(())
    }

    #[inline(never)]
    pub(crate) fn process_position_increase(&mut self, increase_position_payload: IncreasePositionPayload) -> Result<()>{
        self.staked_amount = self.staked_amount.checked_add(increase_position_payload.increase_amount()).ok_or(LaunchpoolError::StakedAmountOverflow)?;
        self.participants_reward_left_to_distribute = self.participants_reward_left_to_distribute.checked_sub(increase_position_payload.pending()).ok_or(LaunchpoolError::RewardDistributionOverflow)?;
        Ok(())
    }

    #[inline(never)]
    pub(crate) fn process_position_close(&mut self, close_position_payload: ClosePositionPayload) -> Result<()>{
        self.staked_amount = self.staked_amount.checked_sub(close_position_payload.stake_amount()).ok_or(LaunchpoolError::StakedAmountOverflow)?;
        let (reward_earned, reward_to_return) = close_position_payload.reward_earned().split();
        self.participants_reward_left_to_distribute = self.participants_reward_left_to_distribute
            .checked_sub(close_position_payload.pending()).ok_or(LaunchpoolError::RewardDistributionOverflow)?
            .checked_add(Q64_128::from_bits(0, reward_to_return)).ok_or(LaunchpoolError::RewardDistributionOverflow)?;
        self.participants_reward_left_to_obtain = self.participants_reward_left_to_obtain.checked_sub(reward_earned).ok_or(LaunchpoolError::RewardObtentionOverflow)?;
        Ok(())
    }

    #[inline]
    pub(crate) fn collect_protocol_reward(&mut self, _payload: CollectProtocolRewardPayload) {
        self.status = LaunchpoolStatus::ClaimedProtocolReward;
        self.protocol_reward_left_to_obtain = 0;
    }
}

#[cfg(test)]
mod tests {
    use anchor_lang::Discriminator;
    use utilities::constants::ANCHOR_DISCRIMINATOR;
    use super::*;

    mod integrity_tests {
        use super::*;

        #[test]
        fn test_launchpool_data_layout() {
            let reward_vault = Pubkey::new_unique();
            let reward_mint = Pubkey::new_unique();
            let launchpools_config = Pubkey::new_unique();

            let start_timestamp: u64 = 1000;
            let end_timestamp: u64 = 2000;
            let last_stake_timestamp: u64 = 1500;

            let initial_reward_amount: u64 = 1_000_000;
            let participants_reward_amount = Q64_128::from_u64(88888);
            let protocol_reward_amount: u64 = 98765;

            let protocol_reward_left_to_obtain: u64 = 98765;
            let participants_reward_left_to_obtain: u64 = 54321;

            let reward_rate = Q64_128::from_u64(42);
            let reward_per_token = Q64_128::from_u64(1337);

            let staked_amount: u64 = 7777;
            let participants_reward_left_to_distribute = Q64_128::from_u64(12345);

            let min_position_size: u64 = 100;
            let max_position_size: u64 = 100;


            let status = LaunchpoolStatus::Launched;
            let bump = [42u8];
            let reward_vault_bump = [7u8];

            let mut data = [0u8; ANCHOR_DISCRIMINATOR + 275];
            let mut offset = 0;

            data[offset..offset + ANCHOR_DISCRIMINATOR].copy_from_slice(&Launchpool::discriminator());
            offset += ANCHOR_DISCRIMINATOR;
            data[offset..offset + 32].copy_from_slice(reward_vault.as_ref());
            offset += 32;
            data[offset..offset + 32].copy_from_slice(reward_mint.as_ref());
            offset += 32;
            data[offset..offset + 32].copy_from_slice(launchpools_config.as_ref());
            offset += 32;
            data[offset..offset + 8].copy_from_slice(&start_timestamp.to_le_bytes());
            offset += 8;
            data[offset..offset + 8].copy_from_slice(&end_timestamp.to_le_bytes());
            offset += 8;
            data[offset..offset + 8].copy_from_slice(&last_stake_timestamp.to_le_bytes());
            offset += 8;
            data[offset..offset + 8].copy_from_slice(&initial_reward_amount.to_le_bytes());
            offset += 8;
            data[offset..offset + 16].copy_from_slice(&participants_reward_amount.get_fractional_bits().to_le_bytes());
            offset += 16;
            data[offset..offset + 8].copy_from_slice(&participants_reward_amount.get_integer_bits().to_le_bytes());
            offset += 8;
            data[offset..offset + 8].copy_from_slice(&protocol_reward_amount.to_le_bytes());
            offset += 8;
            data[offset..offset + 8].copy_from_slice(&protocol_reward_left_to_obtain.to_le_bytes());
            offset += 8;
            data[offset..offset + 8].copy_from_slice(&participants_reward_left_to_obtain.to_le_bytes());
            offset += 8;
            data[offset..offset + 8].copy_from_slice(&staked_amount.to_le_bytes());
            offset += 8;
            data[offset..offset + 16].copy_from_slice(&participants_reward_left_to_distribute.get_fractional_bits().to_le_bytes());
            offset += 16;
            data[offset..offset + 8].copy_from_slice(&participants_reward_left_to_distribute.get_integer_bits().to_le_bytes());
            offset += 8;
            data[offset..offset + 16].copy_from_slice(&reward_rate.get_fractional_bits().to_le_bytes());
            offset += 16;
            data[offset..offset + 8].copy_from_slice(&reward_rate.get_integer_bits().to_le_bytes());
            offset += 8;
            data[offset..offset + 16].copy_from_slice(&reward_per_token.get_fractional_bits().to_le_bytes());
            offset += 16;
            data[offset..offset + 8].copy_from_slice(&reward_per_token.get_integer_bits().to_le_bytes());
            offset += 8;
            data[offset..offset + 8].copy_from_slice(&min_position_size.to_le_bytes());
            offset += 8;
            data[offset..offset + 8].copy_from_slice(&max_position_size.to_le_bytes());
            offset += 8;
            data[offset] = status as u8;
            offset += 1;
            data[offset] = bump[0];
            offset += 1;
            data[offset] = reward_vault_bump[0];
            offset += 1;

            assert_eq!(offset, ANCHOR_DISCRIMINATOR + 275);

            let deserialized_launchpool = Launchpool::try_deserialize(&mut data.as_slice()).unwrap();

            assert_eq!(deserialized_launchpool.reward_vault(), &reward_vault);
            assert_eq!(deserialized_launchpool.reward_mint(), &reward_mint);
            assert_eq!(deserialized_launchpool.launchpools_config(), &launchpools_config);
            assert_eq!(deserialized_launchpool.start_timestamp(), start_timestamp);
            assert_eq!(deserialized_launchpool.end_timestamp(), end_timestamp);
            assert_eq!(deserialized_launchpool.last_update_timestamp(), last_stake_timestamp);
            assert_eq!(deserialized_launchpool.initial_reward_amount(), initial_reward_amount);
            assert_eq!(deserialized_launchpool.participants_reward_amount(), participants_reward_amount);
            assert_eq!(deserialized_launchpool.protocol_reward_amount(), protocol_reward_amount);
            assert_eq!(deserialized_launchpool.protocol_reward_left_to_obtain(), protocol_reward_left_to_obtain);
            assert_eq!(deserialized_launchpool.participants_reward_left_to_obtain(), participants_reward_left_to_obtain);
            assert_eq!(deserialized_launchpool.staked_amount(), staked_amount);
            assert_eq!(deserialized_launchpool.participants_reward_left_to_distribute(), participants_reward_left_to_distribute);
            assert_eq!(deserialized_launchpool.reward_rate(), reward_rate);
            assert_eq!(deserialized_launchpool.reward_per_token(), reward_per_token);
            assert_eq!(deserialized_launchpool.min_position_size(), min_position_size);
            assert_eq!(deserialized_launchpool.max_position_size(), max_position_size);
            assert_eq!(deserialized_launchpool.status(), status);
            assert_eq!(deserialized_launchpool.bump(), bump[0]);
            assert_eq!(deserialized_launchpool.reward_vault_bump(), reward_vault_bump[0]);

            let mut serialized_launchpool = Vec::new();
            deserialized_launchpool.try_serialize(&mut serialized_launchpool).unwrap();
            assert_eq!(serialized_launchpool.as_slice(), data.as_ref());
        }
        #[test]
        fn test_check_active_state_success() {
            let mut launchpool = Launchpool::default();
            let now = 1234567890;
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.start_timestamp = now - 10;
            launchpool.end_timestamp = now + 10;
            assert!(launchpool.check_active_state(now).is_ok());
        }

        #[test]
        fn test_check_active_state_fails_status() {
            let now = 100;
            let mut launchpool = Launchpool::default();
            launchpool.end_timestamp = 10000;
            launchpool.status = LaunchpoolStatus::Uninitialized;
            assert!(launchpool.check_active_state(now).is_err());
            launchpool.status = LaunchpoolStatus::Initialized;
            assert!(launchpool.check_active_state(now).is_err());
            launchpool.status = LaunchpoolStatus::Finished;
            assert!(launchpool.check_active_state(now).is_err());
            launchpool.status = LaunchpoolStatus::ClaimedProtocolReward;
            assert!(launchpool.check_active_state(now).is_err());
        }

        #[test]
        fn test_check_active_state_fails_not_started() {
            let mut launchpool = Launchpool::default();
            let now = 1234567890;
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.start_timestamp = now + 100;
            launchpool.end_timestamp = now + 200;
            let result = launchpool.check_active_state(now);
            assert!(result.is_err());
        }

        #[test]
        fn test_check_active_state_fails_already_ended() {
            let mut launchpool = Launchpool::default();
            let now = 1234567890;
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.start_timestamp = now - 200;
            launchpool.end_timestamp = now - 1;
            let result = launchpool.check_active_state(now);
            assert!(result.is_err());
        }

        #[test]
        fn test_check_finished_state_success() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Finished;
            launchpool.end_timestamp = 500;
            assert!(launchpool.check_finished_state(600).is_ok());
            launchpool.status = LaunchpoolStatus::ClaimedProtocolReward;
            assert!(launchpool.check_finished_state(600).is_ok());
        }

        #[test]
        fn test_check_finished_state_fails_status() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Uninitialized;
            launchpool.end_timestamp = 500;
            assert!(launchpool.check_finished_state(600).is_err());
            launchpool.status = LaunchpoolStatus::Initialized;
            assert!(launchpool.check_finished_state(600).is_err());
            launchpool.status = LaunchpoolStatus::Launched;
            assert!(launchpool.check_finished_state(600).is_err());
        }

        #[test]
        fn test_check_finished_state_fails_timestamp() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Finished;
            launchpool.end_timestamp = 700;
            assert!(launchpool.check_finished_state(600).is_err());
        }
    }
    mod calculate_tests{
        use super::*;

        #[test]
        fn test_calculate_reward_increment_success() {
            let mut launchpool = Launchpool::default();
            launchpool.last_update_timestamp = 100;
            launchpool.staked_amount = 500;
            launchpool.reward_rate = Q64_128::from_u64(10);

            let effective_time = 150;
            let expected_reward = Q64_128::from_u64(1);

            let result = launchpool.calculate_reward_increment(effective_time).unwrap();
            assert_eq!(result, expected_reward);
        }
        #[test]
        fn test_calculate_reward_increment_overflow() {
            let mut launchpool = Launchpool::default();

            launchpool.last_update_timestamp = 200;
            let result = launchpool.calculate_reward_increment(150);
            assert!(matches!(result, Err(e) if e == LaunchpoolError::EffectiveTimeBeforeLastAccrual.into()));

            launchpool.last_update_timestamp = 1;
            launchpool.staked_amount = 500;
            launchpool.reward_rate = Q64_128::from_u64(u64::MAX);
            let result = launchpool.calculate_reward_increment(u64::MAX);
            assert!(matches!(result, Err(e) if e == LaunchpoolError::RewardCalculationOverflow.into()));

            launchpool.last_update_timestamp = 100;
            launchpool.staked_amount = 0;
            launchpool.reward_rate = Q64_128::from_u64(100);
            let result = launchpool.calculate_reward_increment(150);
            assert!(matches!(result, Err(e) if e == LaunchpoolError::DivisionByZeroDuringRewardCalculation.into()));
        }

        #[test]
        fn test_calculate_reward_rate_success() {
            let mut launchpool = Launchpool::default();
            launchpool.participants_reward_amount = Q64_128::from_u64(1000);
            let duration = 50;
            let expected_rate = Q64_128::from_u64(1000).checked_div(Q64_128::from_u64(50)).unwrap();

            let result = launchpool.calculate_reward_rate(duration).unwrap();
            assert_eq!(result, expected_rate);
        }

        #[test]
        fn test_calculate_reward_rate_overflow() {
            let mut launchpool = Launchpool::default();
            launchpool.participants_reward_amount = Q64_128::from_u64(1000);

            let result = launchpool.calculate_reward_rate(0);
            assert!(matches!(result, Err(e) if e == LaunchpoolError::RewardRateOverflow.into()));
        }

        #[test]
        fn test_get_launch_payload_success() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Initialized;
            launchpool.participants_reward_amount = Q64_128::from_u64(1_000);

            let now = 900;
            let start_timestamp = 1_000;
            let duration = 100;

            let payload = launchpool.get_launch_payload(now, start_timestamp, duration).unwrap();

            assert_eq!(payload.reward_rate(), Q64_128::from_u64(10));
            assert_eq!(payload.start_timestamp(), start_timestamp);
            assert_eq!(payload.end_timestamp(), start_timestamp + duration);
        }

        #[test]
        fn test_get_launch_payload_error_wrong_status() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;

            let result = launchpool.get_launch_payload(1_000, 1900, 100);
            assert!(matches!(result, Err(e) if e == LaunchpoolError::LaunchpoolNotInitialized.into()));
        }

        #[test]
        fn test_get_launch_payload_error_start_time_in_past() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Initialized;

            let now = 1800;
            let start_timestamp = 900;

            let result = launchpool.get_launch_payload(now, start_timestamp, 100);
            assert!(matches!(result, Err(e) if e == LaunchpoolError::StartTimeInPast.into()));
        }

        #[test]
        fn test_get_launch_payload_error_end_time_overflow() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Initialized;
            launchpool.participants_reward_amount = Q64_128::from_u64(1_000);

            let now = u64::MAX / 2;
            let start_timestamp = u64::MAX;
            let duration = 1;

            let result = launchpool.get_launch_payload(now, start_timestamp, duration);
            assert!(matches!(result, Err(e) if e == LaunchpoolError::EndTimeOverflow.into()));
        }

        #[test]
        fn test_get_collect_protocol_reward_payload_success() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Finished;
            launchpool.protocol_reward_amount = 999;

            let payload = launchpool.get_collect_protocol_reward_payload().unwrap();
            assert_eq!(payload.protocol_reward_amount(), 999);
        }

        #[test]
        fn test_get_collect_protocol_reward_payload_wrong_status() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.protocol_reward_amount = 999;

            let result = launchpool.get_collect_protocol_reward_payload();
            assert!(matches!(result, Err(e) if e == LaunchpoolError::LaunchpoolNotFinished.into()));
        }
    }
    mod modifying_test{
        use super::*;
        #[test]
        fn test_accrue_rewards_fails_on_past_time() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.last_update_timestamp = 200;
            launchpool.end_timestamp = 1_000;
            launchpool.staked_amount = 100;
            launchpool.reward_rate = Q64_128::from_u64(10);

            let result = launchpool.accrue_rewards(150);
            assert!(matches!(result, Err(e) if e == LaunchpoolError::EffectiveTimeBeforeLastAccrual.into()));
        }

        #[test]
        fn test_accrue_rewards_on_equal_time() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.last_update_timestamp = 150;
            launchpool.end_timestamp = 1_000;
            launchpool.staked_amount = 100;
            launchpool.reward_rate = Q64_128::from_u64(10);
            launchpool.reward_per_token = Q64_128::from_u64(10);
            let result = launchpool.accrue_rewards(150);
            assert!(result.is_ok());
            assert_eq!(launchpool.reward_per_token(), Q64_128::from_u64(10));
        }

        #[test]
        fn test_accrue_rewards_success_increment() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.last_update_timestamp = 100;
            launchpool.end_timestamp = 1_000;
            launchpool.staked_amount = 200;
            launchpool.reward_rate = Q64_128::from_u64(20);

            let now = 120;
            let elapsed = 20;
            let expected_increment = Q64_128::from_u64(20 * elapsed).checked_div(Q64_128::from_u64(200)).unwrap();

            let result = launchpool.accrue_rewards(now);
            assert!(result.is_ok());
            assert_eq!(launchpool.reward_per_token(), expected_increment);
            assert_eq!(launchpool.last_update_timestamp(), now);
        }

        #[test]
        fn test_accrue_rewards_sets_finished_status() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.last_update_timestamp = 500;
            launchpool.end_timestamp = 600;
            launchpool.staked_amount = 100;
            launchpool.reward_rate = Q64_128::from_u64(10);
            let elapsed = 100;
            let expected_increment = Q64_128::from_u64(10 * elapsed).checked_div(Q64_128::from_u64(100)).unwrap();
            let result = launchpool.accrue_rewards(700);
            assert!(result.is_ok());
            assert_eq!(launchpool.status(), LaunchpoolStatus::Finished);
            assert_eq!(launchpool.last_update_timestamp(), 600);
            assert_eq!(launchpool.reward_per_token(), expected_increment);
        }
        #[test]
        fn test_launch() {
            let mut launchpool = Launchpool::default();
            let payload = LaunchPayload::new(Q64_128::from_u64(50), 123, 999);
            launchpool.launch(payload);
            assert_eq!(launchpool.status(), LaunchpoolStatus::Launched);
            assert_eq!(launchpool.reward_rate(), Q64_128::from_u64(50));
            assert_eq!(launchpool.start_timestamp(), 123);
            assert_eq!(launchpool.last_update_timestamp(), 123);
            assert_eq!(launchpool.end_timestamp(), 999);
        }
        #[test]
        fn test_process_position_open_success() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;
            let payload = OpenPositionPayload::new_test(500);
            assert!(launchpool.process_position_open(payload).is_ok());
            assert_eq!(launchpool.staked_amount(), 500);
        }
        #[test]
        fn test_process_position_open_fails_due_to_overflow() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.staked_amount = u64::MAX;
            let payload = OpenPositionPayload::new_test(1);
            let result = launchpool.process_position_open(payload);
            assert!(result.is_err());
        }

        #[test]
        fn test_process_position_increase_success() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.participants_reward_left_to_distribute = Q64_128::from_u64(1000);
            let payload = IncreasePositionPayload::new_test(200, Q64_128::from_u64(150));
            assert!(launchpool.process_position_increase(payload).is_ok());
            assert_eq!(launchpool.staked_amount(), 200);
            assert_eq!(launchpool.participants_reward_left_to_distribute(), Q64_128::from_u64(850));
        }

        #[test]
        fn test_process_position_increase_fails_due_to_overflow() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Launched;
            launchpool.staked_amount = u64::MAX;
            launchpool.participants_reward_left_to_distribute = Q64_128::from_u64(200);
            let amount_overflow_payload = IncreasePositionPayload::new_test(1, Q64_128::from_u64(150));
            assert!(launchpool.process_position_increase(amount_overflow_payload).is_err());
            let reward_overflow_payload = IncreasePositionPayload::new_test(0, Q64_128::from_u64(201));
            assert!(launchpool.process_position_increase(reward_overflow_payload).is_err());
        }

        #[test]
        fn test_process_position_close_success() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Finished;
            launchpool.staked_amount = 500;
            launchpool.participants_reward_left_to_distribute = Q64_128::from_u64(200);
            launchpool.participants_reward_left_to_obtain = 300;
            let payload = ClosePositionPayload::new_test(500, Q64_128::from_u64(100), Q64_128::from_u64(300));
            assert!(launchpool.process_position_close(payload).is_ok());
            assert_eq!(launchpool.staked_amount(), 0);
            assert_eq!(launchpool.participants_reward_left_to_distribute(), Q64_128::from_u64(100));
            assert_eq!(launchpool.participants_reward_left_to_obtain(), 0);
        }
        #[test]
        fn test_process_position_close_success_with_return() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Finished;
            launchpool.staked_amount = 500;
            launchpool.participants_reward_left_to_distribute = Q64_128::from_u64(200);
            launchpool.participants_reward_left_to_obtain = 300;
            let payload = ClosePositionPayload::new_test(500, Q64_128::from_u64(100), Q64_128::from_bits(300, u128::MAX / 2));
            assert!(launchpool.process_position_close(payload).is_ok());
            assert_eq!(launchpool.staked_amount(), 0);
            assert_eq!(launchpool.participants_reward_left_to_distribute(), Q64_128::from_bits(100, u128::MAX / 2));
            assert_eq!(launchpool.participants_reward_left_to_obtain(), 0);
        }
        #[test]
        fn test_process_position_close_fails_due_to_overflow() {
            let mut launchpool = Launchpool::default();
            launchpool.status = LaunchpoolStatus::Finished;
            launchpool.staked_amount = 100;
            launchpool.participants_reward_left_to_distribute = Q64_128::from_u64(50);
            launchpool.participants_reward_left_to_obtain = 30;
            let payload1 = ClosePositionPayload::new_test(200, Q64_128::from_u64(10), Q64_128::from_u64(10));
            assert!(launchpool.process_position_close(payload1).is_err());
            let payload2 = ClosePositionPayload::new_test(10, Q64_128::from_u64(100), Q64_128::from_u64(10));
            assert!(launchpool.process_position_close(payload2).is_err());
            let payload3 = ClosePositionPayload::new_test(10, Q64_128::from_u64(10), Q64_128::from_u64(50));
            assert!(launchpool.process_position_close(payload3).is_err());
        }

        #[test]
        fn test_collect_protocol_reward_success() {
            let mut launchpool = Launchpool::default();
            launchpool.protocol_reward_left_to_obtain = 1000;
            launchpool.status = LaunchpoolStatus::Finished;
            launchpool.collect_protocol_reward(CollectProtocolRewardPayload::new(1000));
            assert_eq!(launchpool.protocol_reward_left_to_obtain(), 0);
            assert_eq!(launchpool.status(), LaunchpoolStatus::ClaimedProtocolReward);
        }

    }
}