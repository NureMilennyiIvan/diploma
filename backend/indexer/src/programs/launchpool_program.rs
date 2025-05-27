#![allow(non_snake_case, non_upper_case_globals, dead_code)]
use crate::define_program_events_enum;
use launchpool::types::{
    CloseStakePositionEvent, CollectProtocolRewardEvent, IncreaseStakePositionEvent,
    InitializeLaunchpoolEvent, InitializeLaunchpoolsConfigEvent,
    InitializeLaunchpoolsConfigsManagerEvent, LaunchLaunchpoolEvent, OpenStakePositionEvent,
    UpdateLaunchpoolsConfigDurationEvent, UpdateLaunchpoolsConfigPositionSizesEvent,
    UpdateLaunchpoolsConfigProtocolRewardShareEvent, UpdateLaunchpoolsConfigRewardAuthorityEvent,
    UpdateLaunchpoolsConfigsManagerAuthorityEvent,
    UpdateLaunchpoolsConfigsManagerHeadAuthorityEvent,
};
use launchpool::programs::LAUNCHPOOL_ID;
use crate::macros::*;

define_program_events_enum! {
    LAUNCHPOOL_ID,
    pub enum LaunchpoolProgram {
        OpenStakePositionEvent = [43, 163, 16, 37, 74, 4, 209, 161],
        IncreaseStakePositionEvent = [121, 133, 109, 216, 234, 229, 196, 202],
        CloseStakePositionEvent = [100, 168, 243, 5, 211, 21, 49, 217],
        CollectProtocolRewardEvent = [205, 32, 118, 106, 76, 207, 44, 80],
        LaunchLaunchpoolEvent = [157, 245, 31, 39, 189, 53, 99, 115],
        InitializeLaunchpoolEvent = [135, 225, 199, 2, 42, 67, 97, 45],
        InitializeLaunchpoolsConfigEvent = [191, 79, 44, 239, 5, 100, 108, 4],
        UpdateLaunchpoolsConfigRewardAuthorityEvent = [41, 93, 234, 192, 147, 225, 218, 156],
        UpdateLaunchpoolsConfigProtocolRewardShareEvent = [28, 94, 107, 85, 139, 71, 180, 59],
        UpdateLaunchpoolsConfigPositionSizesEvent = [190, 75, 204, 106, 214, 22, 190, 193],
        UpdateLaunchpoolsConfigDurationEvent = [207, 214, 158, 69, 198, 68, 179, 48],
        UpdateLaunchpoolsConfigsManagerAuthorityEvent = [2, 12, 242, 131, 70, 205, 239, 249],
        UpdateLaunchpoolsConfigsManagerHeadAuthorityEvent = [58, 215, 167, 123, 90, 21, 139, 104],
        InitializeLaunchpoolsConfigsManagerEvent = [73, 78, 194, 10, 22, 3, 125, 192],
    }
}

#[cfg(test)]
mod tests {
    use launchpool::types::*;
    use super::LaunchpoolProgram;
    use crate::macros::AnchorProgram;
    use borsh::BorshSerialize;
    use solana_sdk::pubkey::Pubkey;

    #[test]
    fn test_deserialize_open_stake_position_event() {
        let event = OpenStakePositionEvent {
            launchpool: Pubkey::new_unique(),
            signer: Pubkey::new_unique(),
            stake_position: Pubkey::new_unique(),
            staked_amount: 100,
            reward_per_token: Q64128 { value: [1, 2, 3] },
            stake_amount: 100,
            stake_timestamp: 100,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::OpenStakePositionEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::OpenStakePositionEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_increase_stake_position_event() {
        let event = IncreaseStakePositionEvent {
            launchpool: Pubkey::new_unique(),
            signer: Pubkey::new_unique(),
            stake_position: Pubkey::new_unique(),
            staked_amount: 100,
            reward_per_token: Q64128 { value: [1, 2, 3] },
            participants_reward_left_to_distribute: Q64128 { value: [1, 2, 3] },
            increase_stake_amount: 100,
            pending: Q64128 { value: [1, 2, 3] },
            stake_amount: 100,
            reward_earned: Q64128 { value: [1, 2, 3] },
            reward_debt: Q64128 { value: [1, 2, 3] },
            increase_stake_timestamp: 100,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::IncreaseStakePositionEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::IncreaseStakePositionEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_close_stake_position_event() {
        let event = CloseStakePositionEvent {
            launchpool: Pubkey::new_unique(),
            signer: Pubkey::new_unique(),
            stake_position: Pubkey::new_unique(),
            staked_amount: 100,
            reward_per_token: Q64128 { value: [1, 2, 3] },
            participants_reward_left_to_distribute: Q64128 { value: [1, 2, 3] },
            participants_reward_left_to_obtain: 100,
            pending: Q64128 { value: [1, 2, 3] },
            stake_received: 100,
            reward_received: 100,
            close_timestamp: 100,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::CloseStakePositionEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::CloseStakePositionEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }

    }

    #[test]
    fn test_deserialize_collect_protocol_reward_event() {
        let event = CollectProtocolRewardEvent {
            launchpool: Pubkey::new_unique(),
            signer: Pubkey::new_unique(),
            reward_authority: Pubkey::new_unique(),
            reward_authority_account: Pubkey::new_unique(),
            protocol_reward_to_redeem: 100,
            reward_per_token: Q64128 { value: [1, 2, 3] },
            claim_timestamp: 100,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::CollectProtocolRewardEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::CollectProtocolRewardEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_launch_launchpool_event() {
        let event = LaunchLaunchpoolEvent {
            authority: Pubkey::new_unique(),
            launchpool: Pubkey::new_unique(),
            reward_rate: Q64128 { value: [1, 2, 3] },
            start_timestamp: 100,
            end_timestamp: 100,
            last_update_timestamp: 100,
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::LaunchLaunchpoolEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::LaunchLaunchpoolEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_initialize_launchpool_event() {
        let event = InitializeLaunchpoolEvent {
            authority: Pubkey::new_unique(),
            launchpool: Pubkey::new_unique(),
            launchpools_config: Pubkey::new_unique(),
            reward_mint: Pubkey::new_unique(),
            reward_vault: Pubkey::new_unique(),
            initial_reward_amount: 100,
            protocol_reward_amount: 100,
            participants_reward_amount: 100,
            participants_reward_left_to_obtain: 100,
            protocol_reward_left_to_obtain: 100,
            participants_reward_left_to_distribute: Q64128 { value: [1, 2, 3] },
            min_position_size: 100,
            max_position_size: 100,
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::InitializeLaunchpoolEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::InitializeLaunchpoolEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_initialize_launchpools_config_event() {
        let event = InitializeLaunchpoolsConfigEvent {
            authority: Pubkey::new_unique(),
            launchpools_config: Pubkey::new_unique(),
            reward_authority: Pubkey::new_unique(),
            stakable_mint: Pubkey::new_unique(),
            min_position_size: 100,
            max_position_size: 100,
            protocol_reward_share_basis_points: 42,
            duration: 100,
            id: 100,
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::InitializeLaunchpoolsConfigEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::InitializeLaunchpoolsConfigEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_launchpools_config_reward_authority_event() {
        let event = UpdateLaunchpoolsConfigRewardAuthorityEvent {
            authority: Pubkey::new_unique(),
            launchpools_config: Pubkey::new_unique(),
            new_reward_authority: Pubkey::new_unique(),
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::UpdateLaunchpoolsConfigRewardAuthorityEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::UpdateLaunchpoolsConfigRewardAuthorityEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_launchpools_config_protocol_reward_share_event() {
        let event = UpdateLaunchpoolsConfigProtocolRewardShareEvent {
            authority: Pubkey::new_unique(),
            launchpools_config: Pubkey::new_unique(),
            new_protocol_reward_share_basis_points: 42,
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::UpdateLaunchpoolsConfigProtocolRewardShareEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::UpdateLaunchpoolsConfigProtocolRewardShareEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_launchpools_config_position_sizes_event() {
        let event = UpdateLaunchpoolsConfigPositionSizesEvent {
            authority: Pubkey::new_unique(),
            launchpools_config: Pubkey::new_unique(),
            new_min_position_size: 100,
            new_max_position_size: 100,
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::UpdateLaunchpoolsConfigPositionSizesEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::UpdateLaunchpoolsConfigPositionSizesEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_launchpools_config_duration_event() {
        let event = UpdateLaunchpoolsConfigDurationEvent {
            authority: Pubkey::new_unique(),
            launchpools_config: Pubkey::new_unique(),
            new_duration: 100,
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::UpdateLaunchpoolsConfigDurationEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::UpdateLaunchpoolsConfigDurationEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_launchpools_configs_manager_authority_event() {
        let event = UpdateLaunchpoolsConfigsManagerAuthorityEvent {
            authority: Pubkey::new_unique(),
            new_authority: Pubkey::new_unique(),
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::UpdateLaunchpoolsConfigsManagerAuthorityEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::UpdateLaunchpoolsConfigsManagerAuthorityEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_launchpools_configs_manager_head_authority_event() {
        let event = UpdateLaunchpoolsConfigsManagerHeadAuthorityEvent {
            head_authority: Pubkey::new_unique(),
            new_head_authority: Pubkey::new_unique(),
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::UpdateLaunchpoolsConfigsManagerHeadAuthorityEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::UpdateLaunchpoolsConfigsManagerHeadAuthorityEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_initialize_launchpools_configs_manager_event() {
        let event = InitializeLaunchpoolsConfigsManagerEvent {
            signer: Pubkey::new_unique(),
            authority: Pubkey::new_unique(),
            head_authority: Pubkey::new_unique(),
            timestamp: 123456789,
        };

        let mut serialized = Vec::from(LaunchpoolProgram::InitializeLaunchpoolsConfigsManagerEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LaunchpoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LaunchpoolProgram::InitializeLaunchpoolsConfigsManagerEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }
}
