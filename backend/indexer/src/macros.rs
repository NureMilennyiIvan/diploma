use anyhow::{Result as AnyResult};
use solana_sdk::pubkey::Pubkey;

pub trait AnchorProgram: Sized + Send + Sync {
    const PUBKEY: Pubkey;
    fn try_deserialize(data: &[u8]) -> AnyResult<Self>;
}

#[macro_export]
macro_rules! define_program_events_enum {
    (
        $pubkey:expr,
        $(#[$outer:meta])*
        $program_vis:vis enum $program:ident {
            $(
                $event:ident = $discriminator:expr
            ),+ $(,)?
        }
    ) => {
        use paste::paste;
        use anyhow::{Result as AnyResult, anyhow};
        use borsh::de::BorshDeserialize;
        use solana_sdk::pubkey::Pubkey;
        use AnchorProgram;
        $(#[$outer])*
        $program_vis enum $program{
            $(
                $event(Box<$event>)
            ),+
        }

        impl $program{
            paste! {
                $(
                    const [<$event _DISCRIMINATOR>]: [u8; 8] = $discriminator;
                )+
            }
        }

        impl AnchorProgram for $program{
            const PUBKEY: Pubkey = $pubkey;
            fn try_deserialize(data: &[u8]) -> AnyResult<Self> {
                let discriminator_slice = data.get(0..8).ok_or_else(|| anyhow!("Insufficient data for event discriminator"))?;

                paste! {
                    $(
                        if discriminator_slice == &$program::[<$event _DISCRIMINATOR>] {
                            let event = <$event>::try_from_slice(&data[8..])?;
                            return Ok($program::$event(Box::new(event)));
                        }
                    )+
                }
                Err(anyhow!("Unknown event discriminator for {}",  stringify!($program)))
            }
        }
    }
}

mod tests{
    #![allow(non_snake_case, non_upper_case_globals, dead_code)]
    use borsh::*;
    use solana_sdk::pubkey;
    use super::*;
    #[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
    pub struct EventA {
        pub user: Pubkey,
        pub amount: u64,
    }

    #[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
    pub struct EventB {
        pub id: u32,
        pub flag: bool,
    }
    const TEST_ADDRESS: (&'static str, Pubkey) = ("11111111111111111111111111111111", pubkey!("11111111111111111111111111111111"));
    define_program_events_enum! {
        TEST_ADDRESS.1,
        #[derive(Debug)]
        pub enum TestProgram {
            EventA = [1, 2, 3, 4, 5, 6, 7, 8],
            EventB = [8, 7, 6, 5, 4, 3, 2, 1],
        }
    }

    #[test]
    fn test_pubkey() {
        assert_eq!(TestProgram::PUBKEY, TEST_ADDRESS.1);
    }

    #[test]
    fn test_macro_event_a_deserialization() {
        let event = EventA {
            user: Pubkey::new_unique(),
            amount: 777,
        };

        let mut data = Vec::from(TestProgram::EventA_DISCRIMINATOR);
        event.serialize(&mut data).unwrap();

        let parsed = TestProgram::try_deserialize(&data).unwrap();
        match parsed {
            TestProgram::EventA(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_macro_event_b_deserialization() {
        let event = EventB {
            id: 42,
            flag: true,
        };

        let mut data = Vec::from(TestProgram::EventB_DISCRIMINATOR);
        event.serialize(&mut data).unwrap();

        let parsed = TestProgram::try_deserialize(&data).unwrap();
        match parsed {
            TestProgram::EventB(inner) => {
                assert_eq!(*inner, event);
            },
            _ => panic!("Unexpected variant"),
        }
    }

    #[test]
    fn test_macro_unknown_discriminator() {
        let bogus_data = vec![0, 0, 0, 0, 0, 0, 0, 0];
        let err = TestProgram::try_deserialize(&bogus_data).unwrap_err();
        assert!(err.to_string().contains("Unknown event discriminator"));
    }
    #[test]
    fn test_macro_too_short_discriminator() {
        let short_data = vec![1, 2, 3];

        let err = TestProgram::try_deserialize(&short_data).unwrap_err();
        assert!(err.to_string().contains("Insufficient data for event discriminator"));
    }

}