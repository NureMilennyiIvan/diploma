//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshSerialize;
use borsh::BorshDeserialize;

/// Accounts.
#[derive(Debug)]
pub struct InitializeLaunchpool {
      
              
          pub authority: solana_program::pubkey::Pubkey,
          
              
          pub launchpools_configs_manager: solana_program::pubkey::Pubkey,
          
              
          pub launchpools_config: solana_program::pubkey::Pubkey,
          
              
          pub reward_mint: solana_program::pubkey::Pubkey,
          
              
          pub launchpool: solana_program::pubkey::Pubkey,
          
              
          pub reward_vault: solana_program::pubkey::Pubkey,
          
              
          pub rent: solana_program::pubkey::Pubkey,
          
              
          pub system_program: solana_program::pubkey::Pubkey,
          
              
          pub reward_token_program: solana_program::pubkey::Pubkey,
      }

impl InitializeLaunchpool {
  pub fn instruction(&self, args: InitializeLaunchpoolInstructionArgs) -> solana_program::instruction::Instruction {
    self.instruction_with_remaining_accounts(args, &[])
  }
  #[allow(clippy::arithmetic_side_effects)]
  #[allow(clippy::vec_init_then_push)]
  pub fn instruction_with_remaining_accounts(&self, args: InitializeLaunchpoolInstructionArgs, remaining_accounts: &[solana_program::instruction::AccountMeta]) -> solana_program::instruction::Instruction {
    let mut accounts = Vec::with_capacity(9+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            self.authority,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.launchpools_configs_manager,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.launchpools_config,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.reward_mint,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.launchpool,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.reward_vault,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.rent,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.system_program,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.reward_token_program,
            false
          ));
                      accounts.extend_from_slice(remaining_accounts);
    let mut data = borsh::to_vec(&InitializeLaunchpoolInstructionData::new()).unwrap();
          let mut args = borsh::to_vec(&args).unwrap();
      data.append(&mut args);
    
    solana_program::instruction::Instruction {
      program_id: crate::LAUNCHPOOL_ID,
      accounts,
      data,
    }
  }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
 pub struct InitializeLaunchpoolInstructionData {
            discriminator: [u8; 8],
            }

impl InitializeLaunchpoolInstructionData {
  pub fn new() -> Self {
    Self {
                        discriminator: [156, 238, 139, 169, 11, 60, 242, 202],
                                }
  }
}

impl Default for InitializeLaunchpoolInstructionData {
  fn default() -> Self {
    Self::new()
  }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
 pub struct InitializeLaunchpoolInstructionArgs {
                  pub initial_reward_amount: u64,
      }


/// Instruction builder for `InitializeLaunchpool`.
///
/// ### Accounts:
///
                      ///   0. `[writable, signer]` authority
          ///   1. `[]` launchpools_configs_manager
          ///   2. `[]` launchpools_config
          ///   3. `[]` reward_mint
                ///   4. `[writable]` launchpool
                ///   5. `[writable]` reward_vault
                ///   6. `[optional]` rent (default to `SysvarRent111111111111111111111111111111111`)
                ///   7. `[optional]` system_program (default to `11111111111111111111111111111111`)
          ///   8. `[]` reward_token_program
#[derive(Clone, Debug, Default)]
pub struct InitializeLaunchpoolBuilder {
            authority: Option<solana_program::pubkey::Pubkey>,
                launchpools_configs_manager: Option<solana_program::pubkey::Pubkey>,
                launchpools_config: Option<solana_program::pubkey::Pubkey>,
                reward_mint: Option<solana_program::pubkey::Pubkey>,
                launchpool: Option<solana_program::pubkey::Pubkey>,
                reward_vault: Option<solana_program::pubkey::Pubkey>,
                rent: Option<solana_program::pubkey::Pubkey>,
                system_program: Option<solana_program::pubkey::Pubkey>,
                reward_token_program: Option<solana_program::pubkey::Pubkey>,
                        initial_reward_amount: Option<u64>,
        __remaining_accounts: Vec<solana_program::instruction::AccountMeta>,
}

impl InitializeLaunchpoolBuilder {
  pub fn new() -> Self {
    Self::default()
  }
            #[inline(always)]
    pub fn authority(&mut self, authority: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.authority = Some(authority);
                    self
    }
            #[inline(always)]
    pub fn launchpools_configs_manager(&mut self, launchpools_configs_manager: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.launchpools_configs_manager = Some(launchpools_configs_manager);
                    self
    }
            #[inline(always)]
    pub fn launchpools_config(&mut self, launchpools_config: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.launchpools_config = Some(launchpools_config);
                    self
    }
            #[inline(always)]
    pub fn reward_mint(&mut self, reward_mint: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.reward_mint = Some(reward_mint);
                    self
    }
            #[inline(always)]
    pub fn launchpool(&mut self, launchpool: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.launchpool = Some(launchpool);
                    self
    }
            #[inline(always)]
    pub fn reward_vault(&mut self, reward_vault: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.reward_vault = Some(reward_vault);
                    self
    }
            /// `[optional account, default to 'SysvarRent111111111111111111111111111111111']`
#[inline(always)]
    pub fn rent(&mut self, rent: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.rent = Some(rent);
                    self
    }
            /// `[optional account, default to '11111111111111111111111111111111']`
#[inline(always)]
    pub fn system_program(&mut self, system_program: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.system_program = Some(system_program);
                    self
    }
            #[inline(always)]
    pub fn reward_token_program(&mut self, reward_token_program: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.reward_token_program = Some(reward_token_program);
                    self
    }
                    #[inline(always)]
      pub fn initial_reward_amount(&mut self, initial_reward_amount: u64) -> &mut Self {
        self.initial_reward_amount = Some(initial_reward_amount);
        self
      }
        /// Add an additional account to the instruction.
  #[inline(always)]
  pub fn add_remaining_account(&mut self, account: solana_program::instruction::AccountMeta) -> &mut Self {
    self.__remaining_accounts.push(account);
    self
  }
  /// Add additional accounts to the instruction.
  #[inline(always)]
  pub fn add_remaining_accounts(&mut self, accounts: &[solana_program::instruction::AccountMeta]) -> &mut Self {
    self.__remaining_accounts.extend_from_slice(accounts);
    self
  }
  #[allow(clippy::clone_on_copy)]
  pub fn instruction(&self) -> solana_program::instruction::Instruction {
    let accounts = InitializeLaunchpool {
                              authority: self.authority.expect("authority is not set"),
                                        launchpools_configs_manager: self.launchpools_configs_manager.expect("launchpools_configs_manager is not set"),
                                        launchpools_config: self.launchpools_config.expect("launchpools_config is not set"),
                                        reward_mint: self.reward_mint.expect("reward_mint is not set"),
                                        launchpool: self.launchpool.expect("launchpool is not set"),
                                        reward_vault: self.reward_vault.expect("reward_vault is not set"),
                                        rent: self.rent.unwrap_or(solana_program::pubkey!("SysvarRent111111111111111111111111111111111")),
                                        system_program: self.system_program.unwrap_or(solana_program::pubkey!("11111111111111111111111111111111")),
                                        reward_token_program: self.reward_token_program.expect("reward_token_program is not set"),
                      };
          let args = InitializeLaunchpoolInstructionArgs {
                                                              initial_reward_amount: self.initial_reward_amount.clone().expect("initial_reward_amount is not set"),
                                    };
    
    accounts.instruction_with_remaining_accounts(args, &self.__remaining_accounts)
  }
}

  /// `initialize_launchpool` CPI accounts.
  pub struct InitializeLaunchpoolCpiAccounts<'a, 'b> {
          
                    
              pub authority: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub launchpools_configs_manager: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub launchpools_config: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub reward_mint: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub launchpool: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub reward_vault: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub rent: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub system_program: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub reward_token_program: &'b solana_program::account_info::AccountInfo<'a>,
            }

/// `initialize_launchpool` CPI instruction.
pub struct InitializeLaunchpoolCpi<'a, 'b> {
  /// The program to invoke.
  pub __program: &'b solana_program::account_info::AccountInfo<'a>,
      
              
          pub authority: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub launchpools_configs_manager: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub launchpools_config: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub reward_mint: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub launchpool: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub reward_vault: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub rent: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub system_program: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub reward_token_program: &'b solana_program::account_info::AccountInfo<'a>,
            /// The arguments for the instruction.
    pub __args: InitializeLaunchpoolInstructionArgs,
  }

impl<'a, 'b> InitializeLaunchpoolCpi<'a, 'b> {
  pub fn new(
    program: &'b solana_program::account_info::AccountInfo<'a>,
          accounts: InitializeLaunchpoolCpiAccounts<'a, 'b>,
              args: InitializeLaunchpoolInstructionArgs,
      ) -> Self {
    Self {
      __program: program,
              authority: accounts.authority,
              launchpools_configs_manager: accounts.launchpools_configs_manager,
              launchpools_config: accounts.launchpools_config,
              reward_mint: accounts.reward_mint,
              launchpool: accounts.launchpool,
              reward_vault: accounts.reward_vault,
              rent: accounts.rent,
              system_program: accounts.system_program,
              reward_token_program: accounts.reward_token_program,
                    __args: args,
          }
  }
  #[inline(always)]
  pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed_with_remaining_accounts(&[], &[])
  }
  #[inline(always)]
  pub fn invoke_with_remaining_accounts(&self, remaining_accounts: &[(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)]) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed_with_remaining_accounts(&[], remaining_accounts)
  }
  #[inline(always)]
  pub fn invoke_signed(&self, signers_seeds: &[&[&[u8]]]) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed_with_remaining_accounts(signers_seeds, &[])
  }
  #[allow(clippy::arithmetic_side_effects)]
  #[allow(clippy::clone_on_copy)]
  #[allow(clippy::vec_init_then_push)]
  pub fn invoke_signed_with_remaining_accounts(
    &self,
    signers_seeds: &[&[&[u8]]],
    remaining_accounts: &[(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)]
  ) -> solana_program::entrypoint::ProgramResult {
    let mut accounts = Vec::with_capacity(9+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            *self.authority.key,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.launchpools_configs_manager.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.launchpools_config.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.reward_mint.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.launchpool.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.reward_vault.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.rent.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.system_program.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.reward_token_program.key,
            false
          ));
                      remaining_accounts.iter().for_each(|remaining_account| {
      accounts.push(solana_program::instruction::AccountMeta {
          pubkey: *remaining_account.0.key,
          is_signer: remaining_account.1,
          is_writable: remaining_account.2,
      })
    });
    let mut data = borsh::to_vec(&InitializeLaunchpoolInstructionData::new()).unwrap();
          let mut args = borsh::to_vec(&self.__args).unwrap();
      data.append(&mut args);
    
    let instruction = solana_program::instruction::Instruction {
      program_id: crate::LAUNCHPOOL_ID,
      accounts,
      data,
    };
    let mut account_infos = Vec::with_capacity(10 + remaining_accounts.len());
    account_infos.push(self.__program.clone());
                  account_infos.push(self.authority.clone());
                        account_infos.push(self.launchpools_configs_manager.clone());
                        account_infos.push(self.launchpools_config.clone());
                        account_infos.push(self.reward_mint.clone());
                        account_infos.push(self.launchpool.clone());
                        account_infos.push(self.reward_vault.clone());
                        account_infos.push(self.rent.clone());
                        account_infos.push(self.system_program.clone());
                        account_infos.push(self.reward_token_program.clone());
              remaining_accounts.iter().for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

    if signers_seeds.is_empty() {
      solana_program::program::invoke(&instruction, &account_infos)
    } else {
      solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
    }
  }
}

/// Instruction builder for `InitializeLaunchpool` via CPI.
///
/// ### Accounts:
///
                      ///   0. `[writable, signer]` authority
          ///   1. `[]` launchpools_configs_manager
          ///   2. `[]` launchpools_config
          ///   3. `[]` reward_mint
                ///   4. `[writable]` launchpool
                ///   5. `[writable]` reward_vault
          ///   6. `[]` rent
          ///   7. `[]` system_program
          ///   8. `[]` reward_token_program
#[derive(Clone, Debug)]
pub struct InitializeLaunchpoolCpiBuilder<'a, 'b> {
  instruction: Box<InitializeLaunchpoolCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> InitializeLaunchpoolCpiBuilder<'a, 'b> {
  pub fn new(program: &'b solana_program::account_info::AccountInfo<'a>) -> Self {
    let instruction = Box::new(InitializeLaunchpoolCpiBuilderInstruction {
      __program: program,
              authority: None,
              launchpools_configs_manager: None,
              launchpools_config: None,
              reward_mint: None,
              launchpool: None,
              reward_vault: None,
              rent: None,
              system_program: None,
              reward_token_program: None,
                                            initial_reward_amount: None,
                    __remaining_accounts: Vec::new(),
    });
    Self { instruction }
  }
      #[inline(always)]
    pub fn authority(&mut self, authority: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.authority = Some(authority);
                    self
    }
      #[inline(always)]
    pub fn launchpools_configs_manager(&mut self, launchpools_configs_manager: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.launchpools_configs_manager = Some(launchpools_configs_manager);
                    self
    }
      #[inline(always)]
    pub fn launchpools_config(&mut self, launchpools_config: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.launchpools_config = Some(launchpools_config);
                    self
    }
      #[inline(always)]
    pub fn reward_mint(&mut self, reward_mint: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.reward_mint = Some(reward_mint);
                    self
    }
      #[inline(always)]
    pub fn launchpool(&mut self, launchpool: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.launchpool = Some(launchpool);
                    self
    }
      #[inline(always)]
    pub fn reward_vault(&mut self, reward_vault: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.reward_vault = Some(reward_vault);
                    self
    }
      #[inline(always)]
    pub fn rent(&mut self, rent: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.rent = Some(rent);
                    self
    }
      #[inline(always)]
    pub fn system_program(&mut self, system_program: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.system_program = Some(system_program);
                    self
    }
      #[inline(always)]
    pub fn reward_token_program(&mut self, reward_token_program: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.reward_token_program = Some(reward_token_program);
                    self
    }
                    #[inline(always)]
      pub fn initial_reward_amount(&mut self, initial_reward_amount: u64) -> &mut Self {
        self.instruction.initial_reward_amount = Some(initial_reward_amount);
        self
      }
        /// Add an additional account to the instruction.
  #[inline(always)]
  pub fn add_remaining_account(&mut self, account: &'b solana_program::account_info::AccountInfo<'a>, is_writable: bool, is_signer: bool) -> &mut Self {
    self.instruction.__remaining_accounts.push((account, is_writable, is_signer));
    self
  }
  /// Add additional accounts to the instruction.
  ///
  /// Each account is represented by a tuple of the `AccountInfo`, a `bool` indicating whether the account is writable or not,
  /// and a `bool` indicating whether the account is a signer or not.
  #[inline(always)]
  pub fn add_remaining_accounts(&mut self, accounts: &[(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)]) -> &mut Self {
    self.instruction.__remaining_accounts.extend_from_slice(accounts);
    self
  }
  #[inline(always)]
  pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed(&[])
  }
  #[allow(clippy::clone_on_copy)]
  #[allow(clippy::vec_init_then_push)]
  pub fn invoke_signed(&self, signers_seeds: &[&[&[u8]]]) -> solana_program::entrypoint::ProgramResult {
          let args = InitializeLaunchpoolInstructionArgs {
                                                              initial_reward_amount: self.instruction.initial_reward_amount.clone().expect("initial_reward_amount is not set"),
                                    };
        let instruction = InitializeLaunchpoolCpi {
        __program: self.instruction.__program,
                  
          authority: self.instruction.authority.expect("authority is not set"),
                  
          launchpools_configs_manager: self.instruction.launchpools_configs_manager.expect("launchpools_configs_manager is not set"),
                  
          launchpools_config: self.instruction.launchpools_config.expect("launchpools_config is not set"),
                  
          reward_mint: self.instruction.reward_mint.expect("reward_mint is not set"),
                  
          launchpool: self.instruction.launchpool.expect("launchpool is not set"),
                  
          reward_vault: self.instruction.reward_vault.expect("reward_vault is not set"),
                  
          rent: self.instruction.rent.expect("rent is not set"),
                  
          system_program: self.instruction.system_program.expect("system_program is not set"),
                  
          reward_token_program: self.instruction.reward_token_program.expect("reward_token_program is not set"),
                          __args: args,
            };
    instruction.invoke_signed_with_remaining_accounts(signers_seeds, &self.instruction.__remaining_accounts)
  }
}

#[derive(Clone, Debug)]
struct InitializeLaunchpoolCpiBuilderInstruction<'a, 'b> {
  __program: &'b solana_program::account_info::AccountInfo<'a>,
            authority: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                launchpools_configs_manager: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                launchpools_config: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                reward_mint: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                launchpool: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                reward_vault: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                rent: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                system_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                reward_token_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                        initial_reward_amount: Option<u64>,
        /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
  __remaining_accounts: Vec<(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)>,
}

