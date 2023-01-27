const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Staking Pool', function () {
    let stakToken;
    let rewardToken;
    let staking;
    let owner;
    let otherAccount;
    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();
        const stak_contract = await ethers.getContractFactory("StakeToken");
        stakToken = await stak_contract.deploy();
        const reward_contract = await ethers.getContractFactory("RewardToken");
        rewardToken = await reward_contract.deploy();
        const pool_contract = await ethers.getContractFactory('Staking');
        staking = await pool_contract.deploy(stakToken.address, rewardToken.address);

        //transfer reward token to the staking contract (Pool)
        rewardToken.mint(staking.address, 10000);

        //added some stake token to user account
        stakToken.mint(otherAccount.address, 10000);

    });

    describe("Initializing states", function () {
        it("Owner should be the first account or deployer", async function () {
            expect(await staking.owner()).to.equal(owner.address);
        })
        it("staking contract should have a balance of 10000", async function () {
            const stakingBalance = await rewardToken.balanceOf(staking.address);
            expect(stakingBalance).to.equal(10000);
        });

        it("set Duration and reward rate", async function () {
            expect(Number(await staking.finishAt())).to.equal(0);
            await staking.setDuration(1000);
            await staking.setRewardAmount(2000);
            expect(Number(await staking.duration())).to.equal(1000);
            expect(Number(await staking.rewardRate())).to.equal(2);
        });

        it('should throw error if reward rate is less than zero', async () => {
            await staking.setDuration(1000);
            await expect(staking.setRewardAmount(500)).to.revertedWith('reward rate = 0');
        })

        it('should throw error if reward rate is less than zero', async () => {
            await staking.setDuration(100);
            await expect(staking.setRewardAmount(1000000)).to.revertedWith('reward amount > balance');
        })

        it('should thrown an error, if duration is set before the previous duration finishes', async () => {
            await staking.setDuration(100);
            await staking.setRewardAmount(2000);
            await expect(staking.setDuration(500)).to.revertedWith("reward duration not finished");
        })

    });

    describe("staking Operation", () => {

        it("should withdraw from holder account on staking", async () => {
            const balance = Number(await stakToken.balanceOf(otherAccount.address));
            expect(balance).to.equal(10000);
            await stakToken.connect(otherAccount).approve(staking.address, 1000);
            await staking.connect(otherAccount).stake(500);
            expect(Number(await stakToken.balanceOf(otherAccount.address))).to.equal(9500);
        })

        it("should initialize the Principal, staked and totalSupply on staking", async () => {
            await stakToken.connect(otherAccount).approve(staking.address, 1000);
            await staking.connect(otherAccount).stake(500);
            expect(await staking.principal(otherAccount.address)).to.equal(500);
            expect(await staking.staked(otherAccount.address)).to.equal(500);
            expect(await staking.totalSupply()).to.equal(500);


            await staking.connect(otherAccount).stake(400);
            expect(await staking.principal(otherAccount.address)).to.equal(900);
            expect(await staking.staked(otherAccount.address)).to.equal(900);
            expect(await staking.totalSupply()).to.equal(900);
        });

        it("should throw an error, if staking not allowed", async () => {
            await expect(staking.connect(otherAccount).stake(500)).to.revertedWith('ERC20: insufficient allowance');
        })
    });

    describe("WithDraw function", () => {
        beforeEach(async () => {
            await stakToken.connect(otherAccount).approve(staking.address, 500);
            await staking.connect(otherAccount).stake(500);
        });

        it("should reset the varibles after withdrawl", async () => {
            await staking.connect(otherAccount).withdraw(200);
            expect(await staking.principal(otherAccount.address)).to.equal(300);
            expect(await staking.staked(otherAccount.address)).to.equal(300);
            expect(await staking.totalSupply()).to.equal(300);
            expect(Number(await stakToken.balanceOf(otherAccount.address))).to.equal(9700);
        })

        it('should throw error when amount is not valid', async () => {
            await expect(staking.connect(otherAccount).withdraw(0)).to.revertedWith("amount = 0");
            await expect(staking.connect(otherAccount).withdraw(600)).to.revertedWith("Arithmetic operation underflowed or overflowed outside of an unchecked block");
        })
    })

    describe("Auto compounding the value of each stak-Holder", async () => {
        beforeEach(async () => {
            await stakToken.connect(otherAccount).approve(staking.address, 500);
            await staking.connect(otherAccount).stake(500);
        });

        it("Should staked the rewards", async () => {
            await staking.autoCompound(otherAccount.address);
            const staked = Number(await staking.staked(otherAccount.address));
            const principal = Number(await staking.principal(otherAccount.address));
            const rewards = Number(await staking.rewards(otherAccount.address));
            expect(principal + rewards).to.equal(staked);
        })

        it("should thrown an error if account does not have sufficient balance", async () => {
            await expect(staking.autoCompound(owner.address)).to.revertedWith("Not suffient balance");
        })
    })

})