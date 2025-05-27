use anchor_lang::prelude::*;
use anchor_spl::token_interface;
use utilities::math::Q64_128;
use crate::state::launchpool::{Launchpool};
use crate::state::enums::PositionStatus;
use crate::state::launchpool::payloads::LaunchpoolSnapshot;
use crate::state::stake_position::payloads::{ClosePositionPayload, IncreasePositionPayload, OpenPositionPayload};
use super::StakePositionError;

#[account]
#[derive(InitSpace)]
pub struct StakePosition {
    pub authority: Pubkey,
    pub launchpool: Pubkey,
    stake_vault: Pubkey,
    amount: Q64_128,
    reward_earned: Q64_128,
    reward_debt: Q64_128,
    status: PositionStatus,
    bump: [u8; 1],
    stake_vault_bump: [u8; 1],
}

impl StakePosition {
    pub const SEED: &'static [u8] = b"stake_position";

    pub const VAULT_SEED: &'static [u8] = b"vault";

    pub fn seeds(&self) -> [&[u8]; 4] {
        [Self::SEED, self.authority.as_ref(), self.launchpool.as_ref(), self.bump.as_ref()]
    }

    fn update_reward(&mut self, reward_per_token: Q64_128) -> Result<Q64_128> {
        let accumulated = self.amount.checked_mul(reward_per_token).ok_or(StakePositionError::RewardAccumulationOverflow)?;
        let pending = accumulated.checked_sub(self.reward_debt).ok_or(StakePositionError::RewardDebtExceedsAccrued)?;
        self.reward_earned = self.reward_earned.checked_add(pending).ok_or(StakePositionError::RewardOverflow)?;
        Ok(pending)
    }

    fn add_stake(&mut self, added_amount: u64, reward_per_token: Q64_128, min_position_size: u64, max_position_size: u64) -> Result<()> {
        require!(added_amount > 0, StakePositionError::StakeAmountIsZero);
        let new_amount = self.amount.checked_add(Q64_128::from_u64(added_amount)).ok_or(StakePositionError::StakeOverflow)?;
        let amount = new_amount.as_u64();
        require!(amount >= min_position_size, StakePositionError::StakeBelowMinimum);
        require!(amount <= max_position_size, StakePositionError::StakeAboveMaximum);
        self.amount = new_amount;
        self.reward_debt = self.amount.checked_mul(reward_per_token).ok_or(StakePositionError::RewardDebtCalculationOverflow)?;
        Ok(())
    }
    pub(crate) fn initialize(&mut self, owner: &AccountInfo, launchpool: &Account<Launchpool>, stake_vault: &InterfaceAccount<token_interface::TokenAccount>, stake_vault_bump: u8, bump: u8) -> Result<()> {
        require_eq!(self.status, PositionStatus::Uninitialized, StakePositionError::StakePositionAlreadyInitialized);
        self.status = PositionStatus::Initialized;
        self.launchpool = launchpool.key();
        self.stake_vault = stake_vault.key();
        self.authority = owner.key();
        self.reward_earned = Q64_128::from_u64(0);
        self.amount = Q64_128::from_u64(0);
        self.reward_debt = Q64_128::from_u64(0);
        self.bump = [bump];
        self.stake_vault_bump = [stake_vault_bump];
        Ok(())
    }
    pub(crate) fn open_position(&mut self, amount: u64, launchpool_snapshot: LaunchpoolSnapshot) -> Result<OpenPositionPayload> {
        require_keys_eq!(launchpool_snapshot.launchpool().key(), self.launchpool.key(), StakePositionError::MismatchedLaunchpool);
        require_eq!(self.status, PositionStatus::Initialized, StakePositionError::InvalidStakePositionStateForOpen);
        self.add_stake(amount, launchpool_snapshot.reward_per_token(), launchpool_snapshot.min_position_size(), launchpool_snapshot.max_position_size())?;
        self.status = PositionStatus::Opened;
        Ok(OpenPositionPayload::new(amount))
    }
    pub(crate) fn increase_position(&mut self, increase_amount: u64, launchpool_snapshot: LaunchpoolSnapshot) -> Result<IncreasePositionPayload> {
        require_keys_eq!(launchpool_snapshot.launchpool().key(), self.launchpool.key(), StakePositionError::MismatchedLaunchpool);
        require_eq!(self.status, PositionStatus::Opened, StakePositionError::StakePositionNotOpened);
        let pending = self.update_reward(launchpool_snapshot.reward_per_token())?;
        self.add_stake(increase_amount, launchpool_snapshot.reward_per_token(), launchpool_snapshot.min_position_size(), launchpool_snapshot.max_position_size())?;
        Ok(IncreasePositionPayload::new(increase_amount, pending))
    }
    pub(crate) fn close_position(&mut self, launchpool_snapshot: LaunchpoolSnapshot) -> Result<ClosePositionPayload> {
        require_keys_eq!(launchpool_snapshot.launchpool().key(), self.launchpool.key(), StakePositionError::MismatchedLaunchpool);
        require_eq!(self.status, PositionStatus::Opened, StakePositionError::StakePositionNotOpened);
        let pending = self.update_reward(launchpool_snapshot.reward_per_token())?;
        let payload = ClosePositionPayload::new(self.amount.as_u64(), pending, self.reward_earned);
        self.reward_earned = Q64_128::from_u64(0);
        self.amount = Q64_128::from_u64(0);
        self.reward_debt = Q64_128::from_u64(0);
        self.status = PositionStatus::Closed;
        Ok(payload)
    }

    #[inline]
    pub fn status(&self) -> PositionStatus {
        self.status
    }

    #[inline]
    pub fn authority(&self) -> &Pubkey {
        &self.authority
    }

    #[inline]
    pub fn launchpool(&self) -> &Pubkey {
        &self.launchpool
    }

    #[inline]
    pub fn stake_vault(&self) -> &Pubkey {
        &self.stake_vault
    }

    #[inline]
    pub fn amount(&self) -> Q64_128 {
        self.amount
    }

    #[inline]
    pub fn reward_earned(&self) -> Q64_128 {
        self.reward_earned
    }

    #[inline]
    pub fn reward_debt(&self) -> Q64_128 {
        self.reward_debt
    }

    #[inline]
    pub fn stake_vault_bump(&self) -> u8 {
        self.stake_vault_bump[0]
    }

    #[inline]
    pub fn bump(&self) -> u8 {
        self.bump[0]
    }
}

#[cfg(test)]
mod tests {
    use anchor_lang::Discriminator;
    use utilities::constants::ANCHOR_DISCRIMINATOR;
    use super::*;
    use crate::state::enums::{PositionStatus};

    fn default_position() -> StakePosition {
        StakePosition {
            status: PositionStatus::Opened,
            authority: Pubkey::new_unique(),
            launchpool: Pubkey::new_unique(),
            stake_vault: Pubkey::new_unique(),
            amount: Q64_128::from_u64(0),
            reward_earned: Q64_128::from_u64(0),
            reward_debt: Q64_128::from_u64(0),
            stake_vault_bump: [0],
            bump: [0],
        }
    }
    #[test]
    fn test_stake_position_data_layout() {
        let authority = Pubkey::new_unique();
        let launchpool = Pubkey::new_unique();
        let stake_vault = Pubkey::new_unique();
        let amount = Q64_128::from_u64(88888);
        let reward_earned = Q64_128::from_u64(1000);
        let reward_debt = Q64_128::from_u64(2000);
        let status = PositionStatus::Initialized;
        let bump = [42u8];
        let stake_vault_bump = [7u8];

        let mut data = [0u8; ANCHOR_DISCRIMINATOR + 171];
        let mut offset = 0;

        data[offset..offset + ANCHOR_DISCRIMINATOR].copy_from_slice(&StakePosition::discriminator());
        offset += ANCHOR_DISCRIMINATOR;
        data[offset..offset + 32].copy_from_slice(authority.as_ref());
        offset += 32;
        data[offset..offset + 32].copy_from_slice(launchpool.as_ref());
        offset += 32;
        data[offset..offset + 32].copy_from_slice(stake_vault.as_ref());
        offset += 32;
        data[offset..offset + 16].copy_from_slice(&amount.get_fractional_bits().to_le_bytes());
        offset += 16;
        data[offset..offset + 8].copy_from_slice(&amount.get_integer_bits().to_le_bytes());
        offset += 8;
        data[offset..offset + 16].copy_from_slice(&reward_earned.get_fractional_bits().to_le_bytes());
        offset += 16;
        data[offset..offset + 8].copy_from_slice(&reward_earned.get_integer_bits().to_le_bytes());
        offset += 8;
        data[offset..offset + 16].copy_from_slice(&reward_debt.get_fractional_bits().to_le_bytes());
        offset += 16;
        data[offset..offset + 8].copy_from_slice(&reward_debt.get_integer_bits().to_le_bytes());
        offset += 8;
        data[offset] = status as u8;
        offset += 1;
        data[offset] = bump[0];
        offset += 1;
        data[offset] = stake_vault_bump[0];
        offset += 1;

        assert_eq!(offset, ANCHOR_DISCRIMINATOR + 171);

        let deserialized_stake_position = StakePosition::try_deserialize(&mut data.as_slice()).unwrap();

        assert_eq!(deserialized_stake_position.authority(), &authority);
        assert_eq!(deserialized_stake_position.launchpool(), &launchpool);
        assert_eq!(deserialized_stake_position.stake_vault(), &stake_vault);
        assert_eq!(deserialized_stake_position.amount(), amount);
        assert_eq!(deserialized_stake_position.reward_earned(), reward_earned);
        assert_eq!(deserialized_stake_position.reward_debt(), reward_debt);
        assert_eq!(deserialized_stake_position.status(), status);
        assert_eq!(deserialized_stake_position.bump(), bump[0]);
        assert_eq!(deserialized_stake_position.stake_vault_bump(), stake_vault_bump[0]);

        let mut serialized_stake_position = Vec::new();
        deserialized_stake_position.try_serialize(&mut serialized_stake_position).unwrap();
        assert_eq!(serialized_stake_position.as_slice(), data.as_ref());
    }
    #[test]
    fn test_open_position() {
        let snapshot = LaunchpoolSnapshot::new_test(
            Q64_128::from_u64(100),
            Pubkey::new_unique(),
            100,
            250
        );
        let amount = 120;
        let expected_reward_debt = (Q64_128::from_u64(amount) * snapshot.reward_per_token());


        let mut pos = default_position();
        pos.launchpool = snapshot.launchpool().key();
        pos.status = PositionStatus::Initialized;

        let open_result = pos.open_position(amount, snapshot).unwrap();
        assert_eq!(open_result.amount(), amount);

        assert_eq!(pos.status(), PositionStatus::Opened);
        assert_eq!(pos.amount().as_u64(), amount);
        assert_eq!(pos.reward_debt(), expected_reward_debt);
        assert_eq!(pos.reward_earned(), Q64_128::from_u64(0));
    }

    #[test]
    fn test_increase_position() {
        let snapshot = LaunchpoolSnapshot::new_test(
            Q64_128::from_u64(5),
            Pubkey::new_unique(),
            100,
            500,
        );

        let reward_debt = Q64_128::from_u64(100u64);
        let increase_amount = 50u64;
        let initial_amount = reward_debt;
        let accumulated = Q64_128::from_u64(500u64);
        let expected_pending = accumulated - reward_debt;
        let expected_reward = expected_pending;


        let expected_amount = Q64_128::from_u64(150);
        let expected_reward_debt = expected_amount * snapshot.reward_per_token();

        let mut pos = StakePosition {
            status: PositionStatus::Opened,
            authority: Pubkey::new_unique(),
            launchpool: snapshot.launchpool().key(),
            stake_vault: Pubkey::new_unique(),
            amount: initial_amount,
            reward_earned: Q64_128::from_u64(0),
            reward_debt,
            stake_vault_bump: [0],
            bump: [0],
        };

        let result = pos.increase_position(increase_amount, snapshot).unwrap();

        assert_eq!(result.increase_amount(), increase_amount);
        assert_eq!(result.pending(), expected_pending);

        assert_eq!(pos.status(), PositionStatus::Opened);
        assert_eq!(pos.reward_debt(), expected_reward_debt);
        assert_eq!(pos.amount(), expected_amount);
        assert_eq!(pos.reward_earned(), expected_reward);
    }

    #[test]
    fn test_close_position() {
        let snapshot = LaunchpoolSnapshot::new_test(
            Q64_128::from_u64(10),
            Pubkey::new_unique(),
            50,
            500,
        );
        let reward_earned = Q64_128::from_u64(100u64);
        let stake_amount = 100u64;
        let reward_debt = Q64_128::from_u64(400u64);
        let accumulated = Q64_128::from_u64(1000u64);
        let expected_pending = accumulated - reward_debt;
        let expected_reward_earned = reward_earned + expected_pending;

        let mut pos = StakePosition {
            status: PositionStatus::Opened,
            authority: Pubkey::new_unique(),
            launchpool: snapshot.launchpool().key(),
            stake_vault: Pubkey::new_unique(),
            amount: Q64_128::from_u64(stake_amount),
            reward_earned,
            reward_debt,
            stake_vault_bump: [0],
            bump: [0],
        };

        let result = pos.close_position(snapshot).unwrap();

        assert_eq!(result.stake_amount(), stake_amount);
        assert_eq!(result.pending(), expected_pending);
        assert_eq!(result.reward_earned(), expected_reward_earned);

        assert_eq!(pos.amount(), Q64_128::from_u64(0));
        assert_eq!(pos.reward_earned(), Q64_128::from_u64(0));
        assert_eq!(pos.reward_debt(), Q64_128::from_u64(0));
        assert_eq!(pos.status(), PositionStatus::Closed);
    }

    #[test]
    fn test_invalid_statuses() {
        let snapshot = LaunchpoolSnapshot::new_test(
            Q64_128::from_u64(100),
            Pubkey::new_unique(),
            100,
            250
        );

        let mut pos = default_position();
        pos.launchpool = snapshot.launchpool().key();
        pos.status = PositionStatus::Uninitialized;

        let uninit_open_result = pos.open_position(100u64, snapshot.clone());
        let uninit_increase_result = pos.increase_position(100u64, snapshot.clone());
        let uninit_close_result = pos.close_position(snapshot.clone());
        assert!(uninit_open_result.is_err());
        assert!(uninit_increase_result.is_err());
        assert!(uninit_close_result.is_err());
        pos.status = PositionStatus::Initialized;

        let init_increase_result = pos.increase_position(100u64, snapshot.clone());
        let init_close_result = pos.close_position(snapshot.clone());
        assert!(init_increase_result.is_err());
        assert!(init_close_result.is_err());
        pos.status = PositionStatus::Opened;

        let opened_open_result = pos.open_position(100u64, snapshot.clone());
        assert!(opened_open_result.is_err());
        pos.status = PositionStatus::Closed;

        let closed_open_result = pos.open_position(100u64, snapshot.clone());
        let closed_increase_result = pos.increase_position(100u64, snapshot.clone());
        let closed_close_result = pos.close_position(snapshot);
        assert!(closed_open_result.is_err());
        assert!(closed_increase_result.is_err());
        assert!(closed_close_result.is_err());
    }

    #[test]
    fn test_invalid_launchpool() {
        let snapshot = LaunchpoolSnapshot::new_test(
            Q64_128::from_u64(100),
            Pubkey::new_unique(),
            100,
            250
        );

        let mut pos = default_position();

        let open_result = pos.open_position(100u64, snapshot.clone());
        let increase_result = pos.increase_position(100u64, snapshot.clone());
        let close_result = pos.close_position(snapshot.clone());
        assert!(open_result.is_err());
        assert!(increase_result.is_err());
        assert!(close_result.is_err());
    }

    #[test]
    fn test_amount(){
        let snapshot = LaunchpoolSnapshot::new_test(
            Q64_128::from_u64(100),
            Pubkey::new_unique(),
            100,
            250
        );

        let mut pos = default_position();
        pos.launchpool = snapshot.launchpool().key();
        pos.status = PositionStatus::Initialized;

        assert!(pos.open_position(0, snapshot.clone()).is_err());
        assert!(pos.open_position(99, snapshot.clone()).is_err());
        assert!(pos.open_position(251, snapshot.clone()).is_err());
        assert!(pos.open_position(249, snapshot.clone()).is_ok());
        assert!(pos.increase_position(2, snapshot).is_err());
    }

    #[test]
    fn test_add_stake_zero_amount() {
        let mut pos = default_position();
        let res = pos.add_stake(0, Q64_128::from_u64(1), 100, 200);
        assert_eq!(res.unwrap_err(), StakePositionError::StakeAmountIsZero.into());
    }

    #[test]
    fn test_add_stake_below_minimum() {
        let mut pos = default_position();
        let res = pos.add_stake(50, Q64_128::from_u64(1), 100, 200);
        assert_eq!(res.unwrap_err(), StakePositionError::StakeBelowMinimum.into());
    }

    #[test]
    fn test_add_stake_above_maximum() {
        let mut pos = default_position();
        let res = pos.add_stake(300, Q64_128::from_u64(1), 100, 200);
        assert_eq!(res.unwrap_err(), StakePositionError::StakeAboveMaximum.into());
    }

    #[test]
    fn test_add_stake_overflow() {
        let mut pos = default_position();
        pos.amount = Q64_128::MAX;
        let res = pos.add_stake(1, Q64_128::from_u64(1), 1, u64::MAX);
        assert_eq!(res.unwrap_err(), StakePositionError::StakeOverflow.into());
    }

    #[test]
    fn test_add_stake_reward_debt_overflow() {
        let mut pos = default_position();
        let reward_per_token = Q64_128::from_u64(u64::MAX);
        let res = pos.add_stake(200, reward_per_token, 100, 500);
        assert_eq!(res.unwrap_err(), StakePositionError::RewardDebtCalculationOverflow.into());
    }

    #[test]
    fn test_add_stake_valid() {
        let mut pos = default_position();
        let res = pos.add_stake(150, Q64_128::from_u64(2), 100, 200);
        assert!(res.is_ok());
        assert_eq!(pos.amount.as_u64(), 150);
        assert_eq!(pos.reward_debt, Q64_128::from_u64(300));
    }

    #[test]
    fn test_update_reward_accumulation_overflow() {
        let mut pos = default_position();
        pos.amount = Q64_128::from_u64(u64::MAX);
        let res = pos.update_reward(Q64_128::from_u64(2));
        assert_eq!(res.unwrap_err(), StakePositionError::RewardAccumulationOverflow.into());
    }

    #[test]
    fn test_update_reward_debt_exceeds() {
        let mut pos = default_position();
        pos.amount = Q64_128::from_u64(10);
        pos.reward_debt = Q64_128::from_u64(200);
        let res = pos.update_reward(Q64_128::from_u64(10));
        assert_eq!(res.unwrap_err(), StakePositionError::RewardDebtExceedsAccrued.into());
    }

    #[test]
    fn test_update_reward_overflow_earned() {
        let mut pos = default_position();
        pos.amount = Q64_128::from_u64(100);
        pos.reward_debt = Q64_128::from_u64(0);
        pos.reward_earned = Q64_128::from_u64(u64::MAX);
        let res = pos.update_reward(Q64_128::from_u64(1));
        assert_eq!(res.unwrap_err(), StakePositionError::RewardOverflow.into());
    }

    #[test]
    fn test_update_reward_valid() {
        let mut pos = default_position();
        pos.amount = Q64_128::from_u64(100);
        pos.reward_debt = Q64_128::from_u64(200);
        pos.reward_earned = Q64_128::from_u64(50);
        let res = pos.update_reward(Q64_128::from_u64(5));
        assert_eq!(res.unwrap(), Q64_128::from_u64(300));
        assert_eq!(pos.reward_earned, Q64_128::from_u64(350));
    }
}