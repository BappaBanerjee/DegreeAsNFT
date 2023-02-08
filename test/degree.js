const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Fakedegree contract', function () {

    let degree;
    let owner;
    let otherAccount;
    let lastAccount;
    let zeroAddressAcc = "0x0000000000000000000000000000000000000000";
    let token_uri = "https://media.licdn.com/dms/image/D5635AQErWNsnNv0hVA/profile-framedphoto-shrink_400_400/0/1672660732919?e=1675886400&v=beta&t=qTwwjCzReW2x7E8m1xPl9D9ju9r3umOu8vJly0vMhlg";

    //variable used 
    let name = "Bappa";
    let roll = 11;
    let university_name = "VU";

    beforeEach(async function () {
        [owner, otherAccount, lastAccount] = await ethers.getSigners();
        const contract = await ethers.getContractFactory("Degree");
        degree = await contract.deploy();
    })

    describe("setOwner function", function () {
        it("should authorized the address", async function () {
            await degree.setOwner(otherAccount.address);
            expect(await degree.checkOwner(otherAccount.address)).to.equal(true);
        });

        it("should throw an error if called by address other than owner", async function () {
            await expect(degree.connect(otherAccount).setOwner(otherAccount.address)).to.revertedWith("Ownable: caller is not the owner");
        });

        it("should revert if address is already a owner", async function () {
            await expect(degree.setOwner(owner.address)).to.revertedWith("Already a owner");
        })
    });

    describe("remove owner function", function () {
        it("should remove the existing owner", async function () {
            await degree.setOwner(otherAccount.address);
            expect(await degree.checkOwner(otherAccount.address)).to.equal(true);
            await degree.removeOwner(otherAccount.address);
            expect(await degree.checkOwner(otherAccount.address)).to.equal(false);
        });

        it("should revert if address is not an existing address", async function () {
            await expect(degree.removeOwner(otherAccount.address)).to.revertedWith("Not a Owner!");
        })


        it("should revert if called by address other than owner", async function () {
            await expect(degree.connect(otherAccount).removeOwner(otherAccount.address)).to.revertedWith("Ownable: caller is not the owner");
        });

    });

    describe("check owner function", function () {
        it("should return true if address is owner else return false", async function () {
            // let res = await token.checkOwner('0xBd155BB004a6B47A04342b303feAd30309b7ac73');
            let res = await degree.checkOwner(owner.address);
            expect(res).to.equal(true);
            expect(await degree.checkOwner(otherAccount.address)).to.equal(false);
        });

        it("should revert, if the checking address is 0 address ", async function () {
            await expect(degree.checkOwner(zeroAddressAcc)).to.revertedWith("Address can't be zero");
        });

        it("should revert if call by unauthorised address", async function () {
            await expect(degree.connect(otherAccount).checkOwner(otherAccount.address)).to.revertedWith("Not Authorised!");
        });

    });

    describe("Minting", function () {
        it("should mint the degree as NFT", async function () {
            await degree.safeMint(lastAccount.address, name, roll, university_name, token_uri);
            expect(await degree.balanceOf(lastAccount.address)).to.equal(1);
            expect(await degree.ownerOf(0)).to.equal(lastAccount.address);
            let data = await degree.studentDetails(0);
            //converting array to object type....
            let obj_data = Object.assign({}, data);
            expect(obj_data.name).to.equal("Bappa");
            expect(obj_data.roll).to.equal(11);
            expect(obj_data.university_name).to.equal("VU");
            expect(await degree.tokenURI(0)).to.equal(token_uri);

            expect(await degree.safeMint(
                lastAccount.address, name, roll, university_name, token_uri
            )).to.emit("studentRegister").withArgs(
                0, "Bappa", 11, "VU"
            );
        });

        it("should revert if zero address is provided", async function () {
            await expect(degree.safeMint(zeroAddressAcc, name, roll, university_name, token_uri)).to.revertedWith("ERC721: mint to the zero address");
        })

        it("should revert if called by unauthorised address", async function () {
            await expect(degree.connect(otherAccount).safeMint(
                lastAccount.address, name, roll, university_name, token_uri
            )).to.revertedWith(
                "Not Authorised!"
            )
        })
    })

    describe("Burn Token", function () {
        it("should burn the token", async function () {
            await degree.safeMint(lastAccount.address, name, roll, university_name, token_uri);
            expect(await degree.balanceOf(lastAccount.address)).to.equal(1);
            await degree.burnToken(0);
            expect(await degree.balanceOf(lastAccount.address)).to.equal(0);

        });

        it("should revert, if token does not exist", async function () {
            await expect(degree.burnToken(11)).to.revertedWith("invalid Token Id");
        })

        it("should revert if called by unauthorised address", async function () {
            await expect(degree.connect(otherAccount).burnToken(0)).to.revertedWith(
                "Ownable: caller is not the owner"
            );
        })
    });

    describe("Get Token Uri", function () {
        it("should return the token uri of the token ID", async function () {
            await degree.safeMint(lastAccount.address, name, roll, university_name, token_uri);
            expect(await degree.tokenURI(0)).to.equal(token_uri);
        });

        it("should revert if invalid token id is provided", async function () {
            await expect(degree.tokenURI(1)).to.revertedWith("ERC721: invalid token ID");
        })
    })
})