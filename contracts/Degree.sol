// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Degree is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter; 

    //varibales
    struct Student {
        uint256 id;
        string name;
        uint256 roll;
        string university_name;
    }
    mapping(uint256 => Student) public studentDetails; //storing student details
    mapping(address => bool) private isOwner; //to check the owners

    //modifiers
    modifier onlyOwners() {
        require(isOwner[msg.sender], "Not Authorised!");
        _;
    }

    //Events
    event studentRegister(
        uint256 id,
        string name,
        uint256 roll,
        string university_name
    );

    constructor() ERC721("Degree", "Deg") {
        isOwner[msg.sender] = true;
    }

    function setOwner(address _owner) public onlyOwner {
        require(!isOwner[_owner], "Already a owner");
        isOwner[_owner] = true;
    }

    function removeOwner(address _owner) public onlyOwner {
        require(isOwner[_owner], "Not a Owner!");
        delete isOwner[_owner];
    }

    function checkOwner(address _owner) public view onlyOwners returns (bool) {
        require(_owner != address(0), "Address can't be zero");
        return isOwner[_owner];
    }

    function safeMint(
        address to,
        string memory _name,
        uint256 _roll,
        string memory _university_name,
        string memory _tokenUri
    ) public onlyOwners {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        Student storage newStudent = studentDetails[tokenId];
        newStudent.id = tokenId;
        newStudent.name = _name;
        newStudent.roll = _roll;
        newStudent.university_name = _university_name;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenUri);
        emit studentRegister(tokenId, _name, _roll, _university_name);
    }

    // function setTokenUri(uint256 _tokenId, string memory _tokenUri)
    //     external
    //     onlyOwner
    // {
    //     require(_exists(_tokenId), "Invalid token id");
    //     _setTokenURI(_tokenId, _tokenUri);
    // }

    function burnToken(uint256 _tokenId) external onlyOwner {
        require(_exists(_tokenId), "invalid Token Id");
        _burn(_tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
        onlyOwner
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
