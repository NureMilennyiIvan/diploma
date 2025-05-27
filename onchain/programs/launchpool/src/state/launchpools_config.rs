use anchor_lang::{account, require, InitSpace};
use anchor_lang::prelude::*;
use crate::error::ErrorCode;

#[account]
#[derive(InitSpace)]
pub struct LaunchpoolsConfig {
    stakable_mint: Pubkey,
    reward_authority: Pubkey,
    min_position_size: u64,
    max_position_size: u64,
    protocol_reward_share_basis_points: u16,
    duration: u64,
    bump: u8,
    pub id: u64
}

impl LaunchpoolsConfig {
    pub const SEED: &'static [u8] = b"launchpools_config";

    pub(crate) fn initialize(&mut self, reward_authority: Pubkey, stakable_mint: Pubkey, min_position_size: u64, max_position_size: u64, protocol_reward_share_basis_points: u16, duration: u64, id: u64, bump: u8) -> Result<()> {
        require!(protocol_reward_share_basis_points <= 10000, ErrorCode::ConfigRewardShareExceeded);
        require!(duration > 0, ErrorCode::InvalidDuration);
        require!(min_position_size > 0, ErrorCode::InvalidMinPositionSize);
        require!(max_position_size >= min_position_size, ErrorCode::InvalidMaxPositionSize);

        self.bump = bump;
        self.id = id;
        self.stakable_mint = stakable_mint;
        self.reward_authority = reward_authority;
        self.min_position_size = min_position_size;
        self.max_position_size = max_position_size;
        self.protocol_reward_share_basis_points = protocol_reward_share_basis_points;
        self.duration = duration;

        Ok(())
    }

    pub(crate) fn update_reward_authority(&mut self, reward_authority: Pubkey) {
        self.reward_authority = reward_authority;
    }

    pub(crate) fn update_protocol_reward_share_basis_points(&mut self, protocol_reward_share_basis_points: u16) -> Result<()> {
        require!(
            protocol_reward_share_basis_points <= 10000,
            ErrorCode::ConfigRewardShareExceeded
        );
        self.protocol_reward_share_basis_points = protocol_reward_share_basis_points;
        Ok(())
    }

    pub(crate) fn update_min_position_size(&mut self, min_position_size: u64) -> Result<()> {
        require!(min_position_size > 0, ErrorCode::InvalidMinPositionSize);
        self.min_position_size = min_position_size;
        Ok(())
    }
    pub(crate) fn update_max_position_size(&mut self, max_position_size: u64) -> Result<()> {
        require!(max_position_size >= self.min_position_size, ErrorCode::InvalidMaxPositionSize);
        self.max_position_size = max_position_size;
        Ok(())
    }

    pub(crate) fn update_duration(&mut self, duration: u64) -> Result<()> {
        require!(duration > 0, ErrorCode::InvalidDuration);
        self.duration = duration;
        Ok(())
    }

    #[inline]
    pub fn reward_authority(&self) -> &Pubkey {
        &self.reward_authority
    }
    #[inline]
    pub fn stakable_mint(&self) -> &Pubkey {
        &self.stakable_mint
    }

    #[inline]
    pub fn protocol_reward_share_basis_points(&self) -> u16 {
        self.protocol_reward_share_basis_points
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
    pub fn duration(&self) -> u64 {
        self.duration
    }
    #[inline]
    pub fn bump(&self) -> u8 {
        self.bump
    }
}

#[cfg(test)]
mod launchpools_config_tests {
    use super::*;
    use anchor_lang::{AccountDeserialize, AccountSerialize, Discriminator};
    use utilities::constants::ANCHOR_DISCRIMINATOR;

    #[test]
    fn test_launchpools_config_initialize() {
        let mut config = LaunchpoolsConfig {
            bump: 0,
            id: 0,
            stakable_mint: Pubkey::default(),
            reward_authority: Pubkey::default(),
            min_position_size: 0,
            max_position_size: 0,
            duration: 0,
            protocol_reward_share_basis_points: 0,
        };

        let reward_authority = Pubkey::new_unique();
        let stakable_mint = Pubkey::new_unique();
        let min_position_size = 100;
        let max_position_size = 10_000;
        let protocol_reward_share_basis_points = 500;
        let duration = 500;
        let id = 123;
        let bump = 255;

        config.initialize(
            reward_authority,
            stakable_mint,
            min_position_size,
            max_position_size,
            protocol_reward_share_basis_points,
            duration,
            id,
            bump,
        ).unwrap();

        assert_eq!(config.bump, bump);
        assert_eq!(config.id, id);
        assert_eq!(config.stakable_mint, stakable_mint);
        assert_eq!(config.reward_authority, reward_authority);
        assert_eq!(config.min_position_size, min_position_size);
        assert_eq!(config.max_position_size, max_position_size);
        assert_eq!(config.protocol_reward_share_basis_points, protocol_reward_share_basis_points);
        assert_eq!(config.duration, duration);
    }

    #[test]
    fn test_update_reward_authority() {
        let mut config = LaunchpoolsConfig {
            bump: 1,
            id: 1,
            stakable_mint: Pubkey::default(),
            reward_authority: Pubkey::default(),
            min_position_size: 100,
            max_position_size: 1_000,
            duration: 0,
            protocol_reward_share_basis_points: 300,
        };

        let new_authority = Pubkey::new_unique();
        config.update_reward_authority(new_authority);
        assert_eq!(config.reward_authority, new_authority);
    }

    #[test]
    fn test_update_protocol_reward_share() {
        let mut config = LaunchpoolsConfig {
            bump: 1,
            id: 1,
            stakable_mint: Pubkey::default(),
            reward_authority: Pubkey::default(),
            min_position_size: 100,
            max_position_size: 1_000,
            duration: 0,
            protocol_reward_share_basis_points: 300,
        };

        assert!(config.update_protocol_reward_share_basis_points(9999).is_ok());
        assert_eq!(config.protocol_reward_share_basis_points, 9999);

        assert!(config.update_protocol_reward_share_basis_points(10001).is_err());
    }

    #[test]
    fn test_update_min_max_position_size() {
        let mut config = LaunchpoolsConfig {
            bump: 1,
            id: 1,
            stakable_mint: Pubkey::default(),
            reward_authority: Pubkey::default(),
            min_position_size: 100,
            max_position_size: 1000,
            duration: 100,
            protocol_reward_share_basis_points: 500,
        };

        assert!(config.update_min_position_size(200).is_ok());
        assert!(config.update_max_position_size(5000).is_ok());

        assert!(config.update_min_position_size(0).is_err());

        config.min_position_size = 1000;
        assert!(config.update_max_position_size(500).is_err());
    }

    #[test]
    fn test_update_duration() {
        let mut config = LaunchpoolsConfig {
            bump: 1,
            id: 1,
            stakable_mint: Pubkey::default(),
            reward_authority: Pubkey::default(),
            min_position_size: 100,
            max_position_size: 1000,
            duration: 100,
            protocol_reward_share_basis_points: 500,
        };

        assert!(config.update_duration(600).is_ok());
        assert_eq!(config.duration, 600);

        assert!(config.update_duration(0).is_err());
    }


    #[test]
    fn test_launchpools_config_data_layout() {
        let bump: u8 = 42;
        let id: u64 = 12345;
        let stakable_mint = Pubkey::new_unique();
        let reward_authority = Pubkey::new_unique();
        let min_position_size: u64 = 100;
        let max_position_size: u64 = 10_000;
        let protocol_reward_share_basis_points: u16 = 999;
        let duration: u64 = 500;

        let mut data = [0u8; ANCHOR_DISCRIMINATOR + 99];
        let mut offset = 0;


        data[offset..offset + ANCHOR_DISCRIMINATOR].copy_from_slice(&LaunchpoolsConfig::discriminator()); offset += ANCHOR_DISCRIMINATOR;
        data[offset..offset + 32].copy_from_slice(stakable_mint.as_ref()); offset += 32;
        data[offset..offset + 32].copy_from_slice(reward_authority.as_ref()); offset += 32;
        data[offset..offset + 8].copy_from_slice(&min_position_size.to_le_bytes()); offset += 8;
        data[offset..offset + 8].copy_from_slice(&max_position_size.to_le_bytes()); offset += 8;
        data[offset..offset + 2].copy_from_slice(&protocol_reward_share_basis_points.to_le_bytes()); offset += 2;
        data[offset..offset + 8].copy_from_slice(&duration.to_le_bytes()); offset += 8;
        data[offset..offset + 1].copy_from_slice(&bump.to_le_bytes()); offset += 1;
        data[offset..offset + 8].copy_from_slice(&id.to_le_bytes()); offset += 8;

        assert_eq!(offset, ANCHOR_DISCRIMINATOR + 99);

        let deserialized_launchpools_config = LaunchpoolsConfig::try_deserialize(&mut data.as_slice()).unwrap();

        assert_eq!(deserialized_launchpools_config.bump(), bump);
        assert_eq!(deserialized_launchpools_config.id, id);
        assert_eq!(deserialized_launchpools_config.stakable_mint().key(), stakable_mint);
        assert_eq!(deserialized_launchpools_config.reward_authority().key(), reward_authority);
        assert_eq!(deserialized_launchpools_config.min_position_size(), min_position_size);
        assert_eq!(deserialized_launchpools_config.max_position_size(), max_position_size);
        assert_eq!(deserialized_launchpools_config.protocol_reward_share_basis_points(), protocol_reward_share_basis_points);
        assert_eq!(deserialized_launchpools_config.duration(), duration);

        let mut serialized_launchpools_config = Vec::new();
        deserialized_launchpools_config.try_serialize(&mut serialized_launchpools_config).unwrap();
        assert_eq!(serialized_launchpools_config.as_slice(), data.as_ref());
    }

}