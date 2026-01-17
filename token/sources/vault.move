/// Vault Module - Deposit and Withdraw Mock USDC
/// Tracks both deposited_amount and withdrawable_amount separately for each user
#[allow(deprecated_usage, lint(public_entry))]
module token::vault {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use token::usdc::USDC;

    // ======== Error Codes ========
    const EInsufficientWithdrawableBalance: u64 = 0;
    const EZeroAmount: u64 = 1;

    // ======== Structs ========

    /// User account info stored in the vault
    public struct UserAccount has store, drop {
        /// Total amount the user has ever deposited
        deposited_amount: u64,
        /// Current amount the user can withdraw
        withdrawable_amount: u64,
    }

    /// Main vault object - shared so all users can interact with it
    public struct Vault has key {
        id: UID,
        /// Total USDC balance held in the vault
        balance: Balance<USDC>,
        /// Table mapping user addresses to their account info
        accounts: Table<address, UserAccount>,
        /// Total deposited across all users (for stats)
        total_deposited: u64,
        /// Total withdrawn across all users (for stats)
        total_withdrawn: u64,
    }

    // ======== Init ========

    /// Create and share the vault on module publish
    fun init(ctx: &mut TxContext) {
        let vault = Vault {
            id: object::new(ctx),
            balance: balance::zero<USDC>(),
            accounts: table::new(ctx),
            total_deposited: 0,
            total_withdrawn: 0,
        };
        transfer::share_object(vault);
    }

    // ======== Public Entry Functions ========

    /// Deposit USDC into the vault
    /// - Increases both deposited_amount and withdrawable_amount for the user
    public entry fun deposit(
        vault: &mut Vault,
        payment: Coin<USDC>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        assert!(amount > 0, EZeroAmount);

        let sender = tx_context::sender(ctx);

        // Add the coin balance to the vault
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut vault.balance, payment_balance);

        // Update or create user account
        if (table::contains(&vault.accounts, sender)) {
            let account = table::borrow_mut(&mut vault.accounts, sender);
            account.deposited_amount = account.deposited_amount + amount;
            account.withdrawable_amount = account.withdrawable_amount + amount;
        } else {
            let new_account = UserAccount {
                deposited_amount: amount,
                withdrawable_amount: amount,
            };
            table::add(&mut vault.accounts, sender, new_account);
        };

        // Update vault stats
        vault.total_deposited = vault.total_deposited + amount;
    }

    /// Withdraw USDC from the vault
    /// - Decreases only withdrawable_amount (deposited_amount stays as historical record)
    public entry fun withdraw(
        vault: &mut Vault,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(amount > 0, EZeroAmount);

        let sender = tx_context::sender(ctx);

        // Check user has sufficient withdrawable balance
        assert!(table::contains(&vault.accounts, sender), EInsufficientWithdrawableBalance);
        
        let account = table::borrow_mut(&mut vault.accounts, sender);
        assert!(account.withdrawable_amount >= amount, EInsufficientWithdrawableBalance);

        // Update user's withdrawable amount (deposited stays the same)
        account.withdrawable_amount = account.withdrawable_amount - amount;

        // Take the balance from vault and send to user
        let withdrawn_balance = balance::split(&mut vault.balance, amount);
        let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);
        transfer::public_transfer(withdrawn_coin, sender);

        // Update vault stats
        vault.total_withdrawn = vault.total_withdrawn + amount;
    }

    /// Withdraw all available USDC from the vault
    public entry fun withdraw_all(
        vault: &mut Vault,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        assert!(table::contains(&vault.accounts, sender), EInsufficientWithdrawableBalance);
        
        let account = table::borrow(&vault.accounts, sender);
        let amount = account.withdrawable_amount;
        
        if (amount > 0) {
            withdraw(vault, amount, ctx);
        }
    }

    // ======== View Functions ========

    /// Get a user's deposited amount (total historical deposits)
    public fun get_deposited_amount(vault: &Vault, user: address): u64 {
        if (table::contains(&vault.accounts, user)) {
            table::borrow(&vault.accounts, user).deposited_amount
        } else {
            0
        }
    }

    /// Get a user's withdrawable amount (current available balance)
    public fun get_withdrawable_amount(vault: &Vault, user: address): u64 {
        if (table::contains(&vault.accounts, user)) {
            table::borrow(&vault.accounts, user).withdrawable_amount
        } else {
            0
        }
    }

    /// Get user account info (both deposited and withdrawable)
    public fun get_user_account(vault: &Vault, user: address): (u64, u64) {
        if (table::contains(&vault.accounts, user)) {
            let account = table::borrow(&vault.accounts, user);
            (account.deposited_amount, account.withdrawable_amount)
        } else {
            (0, 0)
        }
    }

    /// Get total USDC balance in the vault
    public fun get_vault_balance(vault: &Vault): u64 {
        balance::value(&vault.balance)
    }

    /// Get vault statistics
    public fun get_vault_stats(vault: &Vault): (u64, u64, u64) {
        (
            balance::value(&vault.balance),
            vault.total_deposited,
            vault.total_withdrawn
        )
    }
}
