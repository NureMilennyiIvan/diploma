use solana_sdk::compute_budget::ComputeBudgetInstruction;
use solana_sdk::instruction::Instruction;

pub fn set_compute_budget_ix(cu_amount: u32) -> Instruction{
    ComputeBudgetInstruction::set_compute_unit_limit(cu_amount)
}