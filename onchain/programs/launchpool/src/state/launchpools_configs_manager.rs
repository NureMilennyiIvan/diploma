use anchor_lang::{account, InitSpace};
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct LaunchpoolsConfigsManager {
    authority: Pubkey,
    head_authority: Pubkey,
    configs_count: u64,
    bump: u8,
}

impl LaunchpoolsConfigsManager {
    pub const SEED: &'static [u8] = b"launchpools_configs_manager";

    pub(crate) fn initialize(&mut self, authority: Pubkey, head_authority: Pubkey, bump: u8) {
        self.bump = bump;
        self.configs_count = 0;
        self.update_authority(authority);
        self.update_head_authority(head_authority);
    }

    pub(crate) fn update_authority(&mut self, authority: Pubkey) {
        self.authority = authority;
    }

    pub(crate) fn update_head_authority(&mut self, head_authority: Pubkey) {
        self.head_authority = head_authority;
    }

    pub(crate) fn increment_configs_count(&mut self) {
        self.configs_count = self.configs_count.checked_add(1).unwrap()
    }

    #[inline]
    pub fn head_authority(&self) -> &Pubkey {
        &self.head_authority
    }

    #[inline]
    pub fn authority(&self) -> &Pubkey {
        &self.authority
    }

    #[inline]
    pub fn configs_count(&self) -> u64 {
        self.configs_count
    }

    #[inline]
    pub fn bump(&self) -> u8 {
        self.bump
    }
}

#[cfg(test)]
mod launchpools_configs_manager_tests {
    use anchor_lang::{AccountDeserialize, AccountSerialize, Discriminator, Key};
    use utilities::constants::ANCHOR_DISCRIMINATOR;
    use super::*;

    #[test]
    fn test_launchpools_configs_manager_initialize() {
        let mut manager = LaunchpoolsConfigsManager {
            authority: Pubkey::default(),
            head_authority: Pubkey::default(),
            configs_count: 0,
            bump: 0,
        };

        let authority = Pubkey::new_unique();
        let head_authority = Pubkey::new_unique();
        let bump = 42u8;

        manager.initialize(authority, head_authority, bump);

        assert_eq!(manager.authority, authority);
        assert_eq!(manager.head_authority, head_authority);
        assert_eq!(manager.configs_count, 0);
        assert_eq!(manager.bump, bump);

        assert_eq!(manager.authority().key(), authority);
        assert_eq!(manager.head_authority().key(), head_authority);
        assert_eq!(manager.configs_count(), 0);
        assert_eq!(manager.bump(), bump);
    }

    #[test]
    fn test_launchpools_configs_manager_update_authority() {
        let mut manager = LaunchpoolsConfigsManager {
            authority: Pubkey::default(),
            head_authority: Pubkey::new_unique(),
            configs_count: 10,
            bump: 42,
        };

        let new_authority = Pubkey::new_unique();
        manager.update_authority(new_authority);

        assert_eq!(manager.authority, new_authority);
    }

    #[test]
    fn test_launchpools_configs_manager_update_head_authority(){
        let mut manager = LaunchpoolsConfigsManager {
            authority: Pubkey::new_unique(),
            head_authority: Pubkey::default(),
            configs_count: 10,
            bump: 42,
        };

        let new_head_authority = Pubkey::new_unique();
        manager.update_head_authority(new_head_authority);

        assert_eq!(manager.head_authority, new_head_authority);
    }

    #[test]
    fn test_launchpools_configs_manager_increment_configs_count(){
        let mut manager = LaunchpoolsConfigsManager {
            authority: Pubkey::new_unique(),
            head_authority: Pubkey::new_unique(),
            configs_count: 5,
            bump: 42,
        };

        manager.increment_configs_count();

        assert_eq!(manager.configs_count, 6);
    }

    #[test]
    fn test_launchpools_configs_manager_data_layout() {
        let authority = Pubkey::new_unique();
        let head_authority = Pubkey::new_unique();
        let configs_count = 42u64;
        let bump = 42u8;

        let mut data = [0u8; ANCHOR_DISCRIMINATOR + 73];
        let mut offset = 0;

        data[offset..offset + ANCHOR_DISCRIMINATOR].copy_from_slice(&LaunchpoolsConfigsManager::discriminator()); offset += ANCHOR_DISCRIMINATOR;
        data[offset..offset + 32].copy_from_slice(authority.as_ref()); offset += 32;
        data[offset..offset + 32].copy_from_slice(head_authority.as_ref()); offset += 32;
        data[offset..offset + 8].copy_from_slice(&configs_count.to_le_bytes()); offset += 8;
        data[offset] = bump; offset += 1;

        assert_eq!(offset, ANCHOR_DISCRIMINATOR + 73);

        let deserialized_manager = LaunchpoolsConfigsManager::try_deserialize(&mut data.as_ref()).unwrap();

        assert_eq!(deserialized_manager.authority().key(), authority);
        assert_eq!(deserialized_manager.head_authority().key(), head_authority);
        assert_eq!(deserialized_manager.configs_count(), configs_count);
        assert_eq!(deserialized_manager.bump(), bump);

        let mut serialized_data = Vec::new();
        deserialized_manager.try_serialize(&mut serialized_data).unwrap();
        assert_eq!(serialized_data.as_slice(), data.as_ref());
    }
}