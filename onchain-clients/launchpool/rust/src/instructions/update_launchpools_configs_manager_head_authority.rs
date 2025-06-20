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
pub struct UpdateLaunchpoolsConfigsManagerHeadAuthority {
      
              
          pub head_authority: solana_program::pubkey::Pubkey,
          
              
          pub launchpools_configs_manager: solana_program::pubkey::Pubkey,
          
              
          pub new_head_authority: solana_program::pubkey::Pubkey,
      }

impl UpdateLaunchpoolsConfigsManagerHeadAuthority {
  pub fn instruction(&self) -> solana_program::instruction::Instruction {
    self.instruction_with_remaining_accounts(&[])
  }
  #[allow(clippy::arithmetic_side_effects)]
  #[allow(clippy::vec_init_then_push)]
  pub fn instruction_with_remaining_accounts(&self, remaining_accounts: &[solana_program::instruction::AccountMeta]) -> solana_program::instruction::Instruction {
    let mut accounts = Vec::with_capacity(3+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            self.head_authority,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.launchpools_configs_manager,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.new_head_authority,
            false
          ));
                      accounts.extend_from_slice(remaining_accounts);
    let data = borsh::to_vec(&UpdateLaunchpoolsConfigsManagerHeadAuthorityInstructionData::new()).unwrap();
    
    solana_program::instruction::Instruction {
      program_id: crate::LAUNCHPOOL_ID,
      accounts,
      data,
    }
  }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
 pub struct UpdateLaunchpoolsConfigsManagerHeadAuthorityInstructionData {
            discriminator: [u8; 8],
      }

impl UpdateLaunchpoolsConfigsManagerHeadAuthorityInstructionData {
  pub fn new() -> Self {
    Self {
                        discriminator: [208, 235, 147, 149, 161, 117, 147, 222],
                  }
  }
}

impl Default for UpdateLaunchpoolsConfigsManagerHeadAuthorityInstructionData {
  fn default() -> Self {
    Self::new()
  }
}



/// Instruction builder for `UpdateLaunchpoolsConfigsManagerHeadAuthority`.
///
/// ### Accounts:
///
                      ///   0. `[writable, signer]` head_authority
                ///   1. `[writable]` launchpools_configs_manager
          ///   2. `[]` new_head_authority
#[derive(Clone, Debug, Default)]
pub struct UpdateLaunchpoolsConfigsManagerHeadAuthorityBuilder {
            head_authority: Option<solana_program::pubkey::Pubkey>,
                launchpools_configs_manager: Option<solana_program::pubkey::Pubkey>,
                new_head_authority: Option<solana_program::pubkey::Pubkey>,
                __remaining_accounts: Vec<solana_program::instruction::AccountMeta>,
}

impl UpdateLaunchpoolsConfigsManagerHeadAuthorityBuilder {
  pub fn new() -> Self {
    Self::default()
  }
            #[inline(always)]
    pub fn head_authority(&mut self, head_authority: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.head_authority = Some(head_authority);
                    self
    }
            #[inline(always)]
    pub fn launchpools_configs_manager(&mut self, launchpools_configs_manager: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.launchpools_configs_manager = Some(launchpools_configs_manager);
                    self
    }
            #[inline(always)]
    pub fn new_head_authority(&mut self, new_head_authority: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.new_head_authority = Some(new_head_authority);
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
    let accounts = UpdateLaunchpoolsConfigsManagerHeadAuthority {
                              head_authority: self.head_authority.expect("head_authority is not set"),
                                        launchpools_configs_manager: self.launchpools_configs_manager.expect("launchpools_configs_manager is not set"),
                                        new_head_authority: self.new_head_authority.expect("new_head_authority is not set"),
                      };
    
    accounts.instruction_with_remaining_accounts(&self.__remaining_accounts)
  }
}

  /// `update_launchpools_configs_manager_head_authority` CPI accounts.
  pub struct UpdateLaunchpoolsConfigsManagerHeadAuthorityCpiAccounts<'a, 'b> {
          
                    
              pub head_authority: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub launchpools_configs_manager: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub new_head_authority: &'b solana_program::account_info::AccountInfo<'a>,
            }

/// `update_launchpools_configs_manager_head_authority` CPI instruction.
pub struct UpdateLaunchpoolsConfigsManagerHeadAuthorityCpi<'a, 'b> {
  /// The program to invoke.
  pub __program: &'b solana_program::account_info::AccountInfo<'a>,
      
              
          pub head_authority: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub launchpools_configs_manager: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub new_head_authority: &'b solana_program::account_info::AccountInfo<'a>,
        }

impl<'a, 'b> UpdateLaunchpoolsConfigsManagerHeadAuthorityCpi<'a, 'b> {
  pub fn new(
    program: &'b solana_program::account_info::AccountInfo<'a>,
          accounts: UpdateLaunchpoolsConfigsManagerHeadAuthorityCpiAccounts<'a, 'b>,
          ) -> Self {
    Self {
      __program: program,
              head_authority: accounts.head_authority,
              launchpools_configs_manager: accounts.launchpools_configs_manager,
              new_head_authority: accounts.new_head_authority,
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
    let mut accounts = Vec::with_capacity(3+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            *self.head_authority.key,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.launchpools_configs_manager.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.new_head_authority.key,
            false
          ));
                      remaining_accounts.iter().for_each(|remaining_account| {
      accounts.push(solana_program::instruction::AccountMeta {
          pubkey: *remaining_account.0.key,
          is_signer: remaining_account.1,
          is_writable: remaining_account.2,
      })
    });
    let data = borsh::to_vec(&UpdateLaunchpoolsConfigsManagerHeadAuthorityInstructionData::new()).unwrap();
    
    let instruction = solana_program::instruction::Instruction {
      program_id: crate::LAUNCHPOOL_ID,
      accounts,
      data,
    };
    let mut account_infos = Vec::with_capacity(4 + remaining_accounts.len());
    account_infos.push(self.__program.clone());
                  account_infos.push(self.head_authority.clone());
                        account_infos.push(self.launchpools_configs_manager.clone());
                        account_infos.push(self.new_head_authority.clone());
              remaining_accounts.iter().for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

    if signers_seeds.is_empty() {
      solana_program::program::invoke(&instruction, &account_infos)
    } else {
      solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
    }
  }
}

/// Instruction builder for `UpdateLaunchpoolsConfigsManagerHeadAuthority` via CPI.
///
/// ### Accounts:
///
                      ///   0. `[writable, signer]` head_authority
                ///   1. `[writable]` launchpools_configs_manager
          ///   2. `[]` new_head_authority
#[derive(Clone, Debug)]
pub struct UpdateLaunchpoolsConfigsManagerHeadAuthorityCpiBuilder<'a, 'b> {
  instruction: Box<UpdateLaunchpoolsConfigsManagerHeadAuthorityCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> UpdateLaunchpoolsConfigsManagerHeadAuthorityCpiBuilder<'a, 'b> {
  pub fn new(program: &'b solana_program::account_info::AccountInfo<'a>) -> Self {
    let instruction = Box::new(UpdateLaunchpoolsConfigsManagerHeadAuthorityCpiBuilderInstruction {
      __program: program,
              head_authority: None,
              launchpools_configs_manager: None,
              new_head_authority: None,
                                __remaining_accounts: Vec::new(),
    });
    Self { instruction }
  }
      #[inline(always)]
    pub fn head_authority(&mut self, head_authority: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.head_authority = Some(head_authority);
                    self
    }
      #[inline(always)]
    pub fn launchpools_configs_manager(&mut self, launchpools_configs_manager: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.launchpools_configs_manager = Some(launchpools_configs_manager);
                    self
    }
      #[inline(always)]
    pub fn new_head_authority(&mut self, new_head_authority: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.new_head_authority = Some(new_head_authority);
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
        let instruction = UpdateLaunchpoolsConfigsManagerHeadAuthorityCpi {
        __program: self.instruction.__program,
                  
          head_authority: self.instruction.head_authority.expect("head_authority is not set"),
                  
          launchpools_configs_manager: self.instruction.launchpools_configs_manager.expect("launchpools_configs_manager is not set"),
                  
          new_head_authority: self.instruction.new_head_authority.expect("new_head_authority is not set"),
                    };
    instruction.invoke_signed_with_remaining_accounts(signers_seeds, &self.instruction.__remaining_accounts)
  }
}

#[derive(Clone, Debug)]
struct UpdateLaunchpoolsConfigsManagerHeadAuthorityCpiBuilderInstruction<'a, 'b> {
  __program: &'b solana_program::account_info::AccountInfo<'a>,
            head_authority: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                launchpools_configs_manager: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                new_head_authority: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
  __remaining_accounts: Vec<(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)>,
}

