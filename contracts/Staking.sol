// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Staking {
    ERC20 public stakingToken;
    ERC20 public rewardsToken;

    address public owner;
    // Duration of rewards to be paid out (in seconds)
    uint256 public duration;
    // Timestamp of when the rewards finish
    uint256 public finishAt;
    // Minimum of last updated time and reward finish time
    uint256 public updatedAt;
    // Reward to be paid out per second
    uint256 public rewardRate;
    // Sum of (reward rate * dt * 1e18 / total supply)
    uint256 public rewardPerTokenStored;
    // User address => rewardPerTokenStored
    mapping(address => uint256) public userRewardPerTokenPaid;
    // User address => rewards to be claimed
    mapping(address => uint256) public rewards;
    // Total staked
    uint256 public totalSupply;
    // User address => staked amount
    mapping(address => uint256) public principal;
    mapping(address => uint256) public staked;

    constructor(address _stakingToken, address _rewardsToken) {
        owner = msg.sender;
        stakingToken = ERC20(_stakingToken);
        rewardsToken = ERC20(_rewardsToken);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not authorized");
        _;
    }

    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        updatedAt = lastTimeRewardApplicable();

        if (_account != address(0)) {
            rewards[_account] += earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
        _;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "Amount must be greater than 0");
        bool success = stakingToken.transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(success, "Some error while transaction!");
        //actual investment by the holder
        principal[msg.sender] += _amount;
        //amount stacked in the pool
        staked[msg.sender] += _amount;
        //increase the total supply of the pool
        totalSupply += _amount;
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");
        //decrease the actual investment by the stakeholder
        principal[msg.sender] -= _amount;
        //decrease from staked pool
        staked[msg.sender] -= _amount;
        //update total supply in the pool
        totalSupply -= _amount;
        //transfer the amount to the sender...
        stakingToken.transfer(msg.sender, _amount);
    }

    function autoCompound(address _address)
        public
        onlyOwner
        updateReward(_address)
    {
        //comment this line to avoid test at regular interval
        require(block.timestamp > finishAt, "Wait for some time!");
        require(staked[_address] > 0, "Not suffient balance");
        staked[_address] = principal[_address] + rewards[_address];
    }

    function earned(address _account) public view returns (uint256) {
        return ((staked[_account] *
            (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18);
    }

    function getReward() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            staked[msg.sender] -= reward;
            rewardsToken.transfer(msg.sender, reward);
        }
    }

    function setDuration(uint256 _duration) external onlyOwner {
        require(finishAt < block.timestamp, "reward duration not finished");
        duration = _duration;
    }

    function setRewardAmount(uint256 _amount)
        external
        onlyOwner
        updateReward(address(0))
    {
        if (block.timestamp >= finishAt) {
            rewardRate = _amount / duration;
        } else {
            uint256 remainingRewards = (finishAt - block.timestamp) *
                rewardRate;
            rewardRate = (_amount + remainingRewards) / duration;
        }

        require(rewardRate > 0, "reward rate = 0");
        require(
            rewardRate * duration <= rewardsToken.balanceOf(address(this)),
            "reward amount > balance"
        );

        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return _min(finishAt, block.timestamp);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }

        return
            rewardPerTokenStored +
            (rewardRate * (lastTimeRewardApplicable() - updatedAt) * 1e18) /
            totalSupply;
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }
}
