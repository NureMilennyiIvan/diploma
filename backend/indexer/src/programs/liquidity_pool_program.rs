#![allow(non_snake_case, non_upper_case_globals, dead_code)]
use crate::define_program_events_enum;
use liquidity_pool::types::{InitializeAmmsConfigsManagerEvent, CollectFeesFromCpAmmEvent, InitializeAmmsConfigEvent, InitializeCpAmmEvent, LaunchCpAmmEvent, ProvideToCpAmmEvent, SwapInCpAmmEvent, UpdateAmmsConfigFeeAuthorityEvent, UpdateAmmsConfigProtocolFeeRateEvent, UpdateAmmsConfigProvidersFeeRateEvent, UpdateAmmsConfigsManagerAuthorityEvent, UpdateAmmsConfigsManagerHeadAuthorityEvent, WithdrawFromCpAmmEvent};
use liquidity_pool::programs::LIQUIDITY_POOL_ID;
use crate::macros::*;

define_program_events_enum! {
    LIQUIDITY_POOL_ID,
    #[derive(Debug)]
    pub enum LiquidityPoolProgram {
        SwapInCpAmmEvent = [167, 90, 102, 132, 142, 199, 241, 241],
        ProvideToCpAmmEvent = [169, 179, 105, 2, 40, 101, 75, 46],
        WithdrawFromCpAmmEvent = [20, 17, 220, 146, 91, 169, 183, 30],
        CollectFeesFromCpAmmEvent = [136, 202, 5, 125, 123, 107, 91, 113],
        LaunchCpAmmEvent = [185, 17, 120, 196, 33, 27, 224, 149],
        InitializeCpAmmEvent = [169, 188, 54, 67, 1, 145, 213, 80],
        UpdateAmmsConfigFeeAuthorityEvent = [145, 84, 143, 149, 33, 46, 208, 235],
        UpdateAmmsConfigProtocolFeeRateEvent = [122, 157, 87, 60, 236, 113, 198, 207],
        UpdateAmmsConfigProvidersFeeRateEvent = [182, 212, 34, 247, 179, 94, 71, 148],
        UpdateAmmsConfigsManagerAuthorityEvent = [87, 111, 229, 185, 38, 229, 136, 227],
        UpdateAmmsConfigsManagerHeadAuthorityEvent = [36, 151, 67, 108, 246, 99, 170, 92],
        InitializeAmmsConfigEvent = [138, 41, 61, 174, 151, 6, 209, 181],
        InitializeAmmsConfigsManagerEvent = [99, 45, 79, 86, 159, 151, 244, 154]
    }
}

#[cfg(test)]
mod tests {
    use liquidity_pool::types::*;
    use super::LiquidityPoolProgram;
    use crate::macros::AnchorProgram;
    use borsh::BorshSerialize;
    use solana_sdk::pubkey::Pubkey;

    #[test]
    fn test_deserialize_swap_in_cp_amm_event() {

        let event = SwapInCpAmmEvent {
            swapper: Pubkey::new_unique(),
            cp_amm: Pubkey::new_unique(),
            is_in_out: true,
            swapped_amount: 1_000,
            received_amount: 950,
            estimated_result: 960,
            allowed_slippage: 20,
            base_liquidity: 10_000,
            quote_liquidity: 8_000,
            protocol_base_fees_to_redeem: 15,
            protocol_quote_fees_to_redeem: 25,
            constant_product_sqrt: Q64128 { value: [1, 2, 3] },
            base_quote_ratio_sqrt: Q64128 { value: [4, 5, 6] },
            timestamp: 1_654_321_000,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::SwapInCpAmmEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::SwapInCpAmmEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_provide_to_cp_amm_event() {
        let event = ProvideToCpAmmEvent {
            provider: Pubkey::new_unique(),
            cp_amm: Pubkey::new_unique(),
            provided_base_liquidity: 5_000,
            provided_quote_liquidity: 4_000,
            lp_tokens_minted: 1_000,
            base_liquidity: 15_000,
            quote_liquidity: 12_000,
            lp_tokens_supply: 10_000,
            constant_product_sqrt: Q64128 { value: [7, 8, 9] },
            base_quote_ratio_sqrt: Q64128 { value: [10, 11, 12] },
            timestamp: 1_654_321_111,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::ProvideToCpAmmEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::ProvideToCpAmmEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_withdraw_from_cp_amm_event() {
        let event = WithdrawFromCpAmmEvent {
            withdrawer: Pubkey::new_unique(),
            cp_amm: Pubkey::new_unique(),
            lp_tokens_burned: 2_000,
            withdrawn_base_liquidity: 1_500,
            withdrawn_quote_liquidity: 1_200,
            base_liquidity: 8_500,
            quote_liquidity: 6_800,
            lp_tokens_supply: 9_000,
            constant_product_sqrt: Q64128 { value: [13, 14, 15] },
            base_quote_ratio_sqrt: Q64128 { value: [16, 17, 18] },
            timestamp: 1_654_321_222,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::WithdrawFromCpAmmEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::WithdrawFromCpAmmEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_collect_fees_from_cp_amm_event() {
        let event = CollectFeesFromCpAmmEvent {
            signer: Pubkey::new_unique(),
            cp_amm: Pubkey::new_unique(),
            fee_authority: Pubkey::new_unique(),
            fee_authority_base_account: Pubkey::new_unique(),
            fee_authority_quote_account: Pubkey::new_unique(),
            withdrawn_protocol_base_fees: 123,
            withdrawn_protocol_quote_fees: 456,
            timestamp: 1_654_321_333,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::CollectFeesFromCpAmmEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::CollectFeesFromCpAmmEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_launch_cp_amm_event() {
        let event = LaunchCpAmmEvent {
            creator: Pubkey::new_unique(),
            cp_amm: Pubkey::new_unique(),
            base_liquidity: 10_000,
            quote_liquidity: 8_000,
            initial_locked_liquidity: 500,
            lp_tokens_supply: 12_000,
            constant_product_sqrt: Q64128 { value: [21, 22, 23] },
            base_quote_ratio_sqrt: Q64128 { value: [24, 25, 26] },
            timestamp: 1_654_321_444,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::LaunchCpAmmEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::LaunchCpAmmEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_initialize_cp_amm_event() {
        let event = InitializeCpAmmEvent {
            creator: Pubkey::new_unique(),
            cp_amm: Pubkey::new_unique(),
            amms_config: Pubkey::new_unique(),
            base_mint: Pubkey::new_unique(),
            quote_mint: Pubkey::new_unique(),
            lp_mint: Pubkey::new_unique(),
            cp_amm_base_vault: Pubkey::new_unique(),
            cp_amm_quote_vault: Pubkey::new_unique(),
            cp_amm_locked_lp_vault: Pubkey::new_unique(),
            timestamp: 1_654_321_555,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::InitializeCpAmmEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::InitializeCpAmmEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_amms_config_fee_authority_event() {
        let event = UpdateAmmsConfigFeeAuthorityEvent {
            authority: Pubkey::new_unique(),
            amms_config: Pubkey::new_unique(),
            new_fee_authority: Pubkey::new_unique(),
            timestamp: 1_654_321_666,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::UpdateAmmsConfigFeeAuthorityEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::UpdateAmmsConfigFeeAuthorityEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_amms_config_protocol_fee_rate_event() {
        let event = UpdateAmmsConfigProtocolFeeRateEvent {
            authority: Pubkey::new_unique(),
            amms_config: Pubkey::new_unique(),
            new_protocol_fee_rate_basis_points: 250,
            timestamp: 1_654_321_777,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::UpdateAmmsConfigProtocolFeeRateEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::UpdateAmmsConfigProtocolFeeRateEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_amms_config_providers_fee_rate_event() {
        let event = UpdateAmmsConfigProvidersFeeRateEvent {
            authority: Pubkey::new_unique(),
            amms_config: Pubkey::new_unique(),
            new_providers_fee_rate_basis_points: 180,
            timestamp: 1_654_321_888,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::UpdateAmmsConfigProvidersFeeRateEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::UpdateAmmsConfigProvidersFeeRateEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_amms_configs_manager_authority_event() {
        let event = UpdateAmmsConfigsManagerAuthorityEvent {
            authority: Pubkey::new_unique(),
            new_authority: Pubkey::new_unique(),
            timestamp: 1_654_321_999,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::UpdateAmmsConfigsManagerAuthorityEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::UpdateAmmsConfigsManagerAuthorityEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_update_amms_configs_manager_head_authority_event() {
        let event = UpdateAmmsConfigsManagerHeadAuthorityEvent {
            head_authority: Pubkey::new_unique(),
            new_head_authority: Pubkey::new_unique(),
            timestamp: 1_654_322_000,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::UpdateAmmsConfigsManagerHeadAuthorityEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::UpdateAmmsConfigsManagerHeadAuthorityEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_initialize_amms_config_event() {
        let event = InitializeAmmsConfigEvent {
            authority: Pubkey::new_unique(),
            amms_config: Pubkey::new_unique(),
            fee_authority: Pubkey::new_unique(),
            protocol_fee_rate_basis_points: 300,
            providers_fee_rate_basis_points: 100,
            id: 42,
            timestamp: 1_654_322_111,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::InitializeAmmsConfigEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::InitializeAmmsConfigEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_deserialize_initialize_amms_configs_manager_event() {
        let event = InitializeAmmsConfigsManagerEvent {
            signer: Pubkey::new_unique(),
            authority: Pubkey::new_unique(),
            head_authority: Pubkey::new_unique(),
            timestamp: 1_654_322_222,
        };

        let mut serialized = Vec::from(LiquidityPoolProgram::InitializeAmmsConfigsManagerEvent_DISCRIMINATOR);
        event.serialize(&mut serialized).unwrap();

        let deserialized = LiquidityPoolProgram::try_deserialize(&serialized).unwrap();
        match deserialized {
            LiquidityPoolProgram::InitializeAmmsConfigsManagerEvent(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

}