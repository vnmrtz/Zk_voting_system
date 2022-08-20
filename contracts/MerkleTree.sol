pragma solidity ^0.8.0;

interface IHasher {
    function MiMCSponge(uint256 in_xL, uint256 in_xR)
        external
        returns (uint256 xL, uint256 xR);
}

contract MerkleTree {
    address hasher;
    uint256 public constant FIELD_SIZE =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant ZERO_VALUE = 11111111111111111111111111111111111111111111111111111111111111111111111111111;

    uint32 public levels;

    // the following variables are made public for easier testing and debugging and
    // are not supposed to be accessed in regular code
    bytes32[] public filledSubtrees;
    bytes32[] public zeros;
    uint32 public nextIndex = 0;
    bytes32 public latestRoot; 

    constructor(uint32 _treeLevels, address _hasher) {
        require(_treeLevels > 0, "_treeLevels should be greater than zero");
        require(_treeLevels < 32, "_treeLevels should be less than 32");
        levels = _treeLevels;

        bytes32 currentZero = bytes32(ZERO_VALUE);
        zeros.push(currentZero);
        filledSubtrees.push(currentZero);

        for (uint32 i = 1; i < levels; i++) {
            currentZero = hashLeftRight(currentZero, currentZero);
            zeros.push(currentZero);
            filledSubtrees.push(currentZero);
        }

        latestRoot = hashLeftRight(currentZero, currentZero);
    }

    /**
    @dev Hash 2 tree leaves, returns MiMC(_left, _right)
  */
    function hashLeftRight(bytes32 _left, bytes32 _right)
        public
        
        returns (bytes32)
    {
        require(
            uint256(_left) < FIELD_SIZE,
            "_left should be inside the field"
        );
        require(
            uint256(_right) < FIELD_SIZE,
            "_right should be inside the field"
        );
        uint256 R = uint256(_left);
        uint256 C = 0;
        (R, C) = IHasher(hasher).MiMCSponge(R, C);
        R = addmod(R, uint256(_right), FIELD_SIZE);
        (R, C) = IHasher(hasher).MiMCSponge(R, C);
        return bytes32(R);
    }

    function _insert(bytes32 _leaf) internal returns (uint32 index) {
        uint32 currentIndex = nextIndex;
        require(
            currentIndex != uint32(2)**levels,
            "Merkle tree is full. No more leafs can be added"
        );
        nextIndex += 1;
        bytes32 currentLevelHash = _leaf;
        bytes32 left;
        bytes32 right;

        for (uint32 i = 0; i < levels; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros[i];

                filledSubtrees[i] = currentLevelHash;
            } else {
                left = filledSubtrees[i];
                right = currentLevelHash;
            }

            currentLevelHash = hashLeftRight(left, right);

            currentIndex /= 2;
        }
        return nextIndex - 1;
    }

    /**
    @dev Whether the root is present in the root history
  */
    function isKnownRoot(bytes32 _root) public view returns (bool) {
        if (_root == 0) {
            return false;
        }
        if (_root == latestRoot){
            return true;
        }
        return false;
    }

    /**
    @dev Returns the last root
  */
    function getLastRoot() public view returns (bytes32) {
        return latestRoot;
    }
}