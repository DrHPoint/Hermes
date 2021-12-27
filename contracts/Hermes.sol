//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.1;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ERC20.sol";

/**  
* @title Contract-platform for selling and trading tokens.
* @author Pavel E. Hrushchev (DrHPoint).
* @notice You can use this contract for selling and trading tokens.
* @dev All function calls are currently implemented without side effects. 
*/
contract Hermes is AccessControl {
    bytes32 public constant CHAIR_PERSON = keccak256("CHAIR_PERSON");
    address public tokenAddress;
    uint256 private timeThreshold;
    uint256 private immutable duration = 3 days - 180;
    mapping (address => Account) accounts;
    mapping (uint256 => Order) orders;
    uint256 public currentPrice;
    uint256 private currentOrder = 0;
    uint8 roundNumber;
    bool roundSellType;
    uint256 remainderTokens;
    uint256 tradeVolume = 0;

    /** 
    *@dev The constructor provides the address of the tokens with which the platform will work (_tokenAddress),
    and also set initial values of platform.
    * @param _tokenAddress is the address of the tokens with which the platform will work.
    */  
    constructor(address _tokenAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CHAIR_PERSON, msg.sender);
        tokenAddress = _tokenAddress;
        roundNumber = 0;
        remainderTokens = 10 ** (ERC20(tokenAddress).decimals() + 5);
        roundSellType = false;
        currentPrice =  10 ** (ERC20(tokenAddress).decimals() - 5);
    }

    ///@dev modifier to check trade round type and registration of account.
    modifier forTrade () {
        require(roundSellType != true, "Trade round has not come yet");
        require(accounts[msg.sender].registration, "Account not registered");
        _;
    }

    ///@dev modifier to check sell round type and registration of account.
    modifier forSell () {
        require(roundSellType, "Sell round has not come yet");
        require(accounts[msg.sender].registration, "Account not registered");
        _;
    }

    /** 
    * @notice This event shows under what number the sell round was begin (_roundNumber), 
    the volume of tokens to be sold in this round (_tokenVolume), 
    and round end time (_timeThreshold).
    * @dev Nothing unusual. Standard event with round number, volume of tokens and end time.
    * @param _roundNumber is the number of the begin sell round.
    * @param _tokenVolume is the volume of tokens to be sold in this round.
    * @param _timeThreshold is the round end time.
    */
    event NewSellRound(uint8 _roundNumber, uint256 _tokenVolume, uint256 _timeThreshold);
    
    /** 
    * @notice This event shows under what number the trade round was begin (_roundNumber), 
    and round end time (_timeThreshold).
    * @dev Nothing unusual. Standard event with round number and end time.
    * @param _roundNumber is the number of the begin trade round.
    * @param _timeThreshold is the round end time.
    */
    event NewTradeRound(uint8 _roundNumber, uint256 _timeThreshold);
    
    /** 
    * @notice This event shows under what number the sell round is ended (_roundNumber), 
    and round end time (_remainderTokens).
    * @dev Nothing unusual. Standard event with round number and volume of remainded tokens.
    * @param _roundNumber is the number of the end trade round.
    * @param _remainderTokens is the round end time.
    */
    event CloseSellRound(uint8 _roundNumber, uint256 _remainderTokens);
    
    /** 
    * @notice This event shows under what number the order is created (_orderNumber),
    address of this order owner(_orderOwner) and value of this order tokens (_value).
    * @dev Nothing unusual. Standard event with order number, order owner and value tokens of this order.
    * @param _orderNumber is the number of the begin trade round.
    * @param _orderOwner is the round end time.
    * @param _value is the round end time.
    */
    event NewOrder(uint256 _orderNumber, address _orderOwner, uint256 _value);
    
    /** 
    * @notice This event shows under what number the order is ended (_orderNumber),
    and address of this order owner(_orderOwner).
    * @dev Nothing unusual. Standard event with order number and order owner.
    * @param _orderNumber is the number of the begin trade round.
    * @param _orderOwner is the round end time.
    */
    event CloseOrder(uint256 _orderNumber, address _orderOwner);

    struct Account {
        address referral;
        bool registration;
    }

    struct Order {
        address orderOwner;
        uint256 value;
        bool status;
    }

    /**  
    * @notice This function checks the role for changing the round and calls the corresponding function for this type of round.
    * @dev Standart function without any complexity, except require CHAIR_PERSON role.
    */
    function newRound() external {
        require(hasRole(CHAIR_PERSON, msg.sender), "Person doesnt have the CHAIR_PERSON role");
        if (roundSellType)
            newTradeRound();
        else
            newSellRound();
    }

    /**  
    * @notice This function allows you to call the beginning of the sell type round.
    * @dev This function is called when it is necessary to start a round of sells. 
    Function checks the expiration of the time of the previous round and, 
    having set the values of the cost of tokens and the volume of their sells in this round, 
    mints the tokens from the token contract, and also set type of sell round.
    */
    function newSellRound() private {
        require(timeThreshold < block.timestamp, "Previous round isnt over");
        roundNumber++;
        timeThreshold = block.timestamp + duration;
        if (roundNumber > 1) 
        {
            currentPrice = currentPrice * 103 / 100 + 4 * (10 ** (ERC20(tokenAddress).decimals() - 6));
            remainderTokens = tradeVolume / currentPrice * 10 ** ERC20(tokenAddress).decimals();
            tradeVolume = 0;
        }
        ERC20(tokenAddress).mint(address(this), remainderTokens);
        emit NewSellRound(roundNumber, remainderTokens, timeThreshold);
        roundSellType = true;
    }

    /**  
    * @notice This function allows you to call the beginning of the trade type round.
    * @dev This function is called when it is necessary to start a round of trade. 
    Function checks the expiration of the time of the previous round or exhaustion of the volume of tokens,
    if the tokens in the last round didnt run out, burns them using the token contract,
    and also set type of trade round.
    */
    function newTradeRound() private {
        require(((timeThreshold < block.timestamp)||(remainderTokens == 0)), "Previous round isnt over");
        timeThreshold = block.timestamp + duration;
        if (remainderTokens != 0)
        {
            emit CloseSellRound(roundNumber, remainderTokens);
            ERC20(tokenAddress).burn(address(this), ERC20(tokenAddress).balanceOf(address(this)));
        }
        emit NewTradeRound(roundNumber, timeThreshold);
        roundSellType = false;
    }

    /**  
    * @notice This function allows you to register on this platform with the indication of a referral who may already be registered.
    * @dev This function checks the presence of a user with the given address on the platform, 
    also checks the referral's address for availability on the platform, if the referral address is not zero, 
    and adds the user to the map.
    * @param _referral - is the address of referral, who maybe registered in this platform.
    */
    function register(address _referral) external {
        require(accounts[msg.sender].registration == false, "Account already registered");
        if(_referral != address(0))
            require(accounts[_referral].registration == true, "Referral account not registered");
        accounts[msg.sender].registration = true;
        accounts[msg.sender].referral = _referral;
    }

    /**  
    * @notice This function allows you to buy tokens with Eth
    * @dev This function checks the completeness of the last round, 
    calculates the required amount of tokens, if there are not enough tokens 
    on the platform's account, it returns a part of the eth to the user 
    and transfers the tokens. The function also deducts a part of the Eth for referrals.
    */
    function buyToken() external payable forSell {
        require(((timeThreshold > block.timestamp) && (remainderTokens > 0)), "Sell round is over");
        require(msg.value > 0, "Value is zero wei");
        uint256 convertToken = msg.value / currentPrice * 10 ** ERC20(tokenAddress).decimals();
        uint256 surplus = 0;
        if (convertToken <= remainderTokens)
        {
            ERC20(tokenAddress).transfer(msg.sender, convertToken);
            remainderTokens -= convertToken;
        }
        else
        {
            surplus = (convertToken - remainderTokens) * currentPrice / (10 ** ERC20(tokenAddress).decimals());
            payable(msg.sender).transfer(surplus);
            ERC20(tokenAddress).transfer(msg.sender, remainderTokens);
            remainderTokens = 0;
            emit CloseSellRound(roundNumber, remainderTokens);
        }
        if (accounts[msg.sender].referral != address(0))
        {
            address payable referral = payable(accounts[msg.sender].referral);
            referral.transfer((msg.value - surplus) / 100 * 5);
            if (accounts[referral].referral != address(0))
                payable(accounts[referral].referral).transfer((msg.value - surplus) / 100 * 3);
        }
            
    }

    /**  
    * @notice This function allows you to create orders to sell your tokens in the specified quantity.
    * @dev This function checks the possibility of creating such an order 
    and creates an order in the map, removing tokens from the user's balance on token contract
    * @param _value - is the amount of token, that user want to deposite.
    */
    function newOrder(uint256 _value) external forTrade {
        require(ERC20(tokenAddress).balanceOf(msg.sender) >= _value);
        require(ERC20(tokenAddress).transferFrom(msg.sender, address(this), _value));
        orders[currentOrder] = Order(msg.sender, _value, true);
        emit NewOrder(currentOrder, msg.sender, _value);
        currentOrder++;
    }

    /**  
    * @notice This function allows you to redeem tokens for Eth from orders created by other users.
    * @dev This function checks the possibility of redeeming tokens from the order,
    calculates the required amount of tokens, if there are not enough tokens 
    on the order's value, it returns a part of the eth to the user 
    and transfers the tokens. The function also deducts a part of the Eth for referrals of the owner of order
    and calculate total trade volume of this trade round.
    * @param _orderNumber - is the order number from which tokens are redeemed.
    */
    function trade(uint256 _orderNumber) external payable forTrade {
        require(orders[_orderNumber].status, "Order is closed");
        require(msg.value != 0, "Value is zero wei");
        uint256 convertToken = msg.value / currentPrice * 10 ** ERC20(tokenAddress).decimals();
        uint256 surplus = 0;
        if(convertToken <= orders[_orderNumber].value)
        {
            ERC20(tokenAddress).transfer(msg.sender, convertToken);
            orders[_orderNumber].value -= convertToken;
            tradeVolume += convertToken;
        }
        else
        {
            surplus = (convertToken - orders[_orderNumber].value) * currentPrice / (10 ** ERC20(tokenAddress).decimals());
            payable(msg.sender).transfer(surplus);
            ERC20(tokenAddress).transfer(msg.sender, orders[_orderNumber].value);
            payable(orders[_orderNumber].orderOwner).transfer((msg.value - surplus) / 100 * 95);
            tradeVolume += orders[_orderNumber].value;
            orders[_orderNumber].value = 0;
        }
        if (accounts[orders[_orderNumber].orderOwner].referral != address(0))
        {
            address payable referral = payable(accounts[orders[_orderNumber].orderOwner].referral);
            referral.transfer((msg.value - surplus) / 1000 * 25);
            if (accounts[referral].referral != address(0))
                payable(accounts[referral].referral).transfer((msg.value - surplus) / 1000 * 25);
        }
        if (orders[_orderNumber].value == 0)
        {
            orders[_orderNumber].status = false;
            emit CloseOrder(_orderNumber, orders[_orderNumber].orderOwner);
        }
    }

    /**  
    * @notice This function allows you to close your order.
    * @dev This function checks the ownership of the order, its status 
    and closes it by transferring tokens to the owner's address.
    * @param _orderNumber - is the order number from which tokens to be transfer.
    */
    function closeOrder(uint256 _orderNumber) external {
        require(orders[_orderNumber].orderOwner == msg.sender, "User doesnt own this order");
        require(orders[_orderNumber].status, "Order is closed");
        ERC20(tokenAddress).transfer(msg.sender, orders[_orderNumber].value);
        orders[_orderNumber].status = false;
        emit CloseOrder(_orderNumber, orders[_orderNumber].orderOwner); 
    }

    /**  
    * @notice This function allows you to transfer Eth to the address of the platform owner.
    * @dev This function checks the ownership of the platform and its balance, 
    and then transfers the required amount to the owner's address.
    * @param _value - is the Eth amount to be transferred.
    */
    function ethToOwner(uint256 _value) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Person doesnt have the DEFAULT_ADMIN_ROLE role");
        require(payable(address(this)).balance >= _value, "Contract doesn't have enough eth");
        payable(msg.sender).transfer(_value);
    }

    /**  
    * @notice This function shows the current price for the token on Eth.
    * @dev Standart view function.
    */
    function getCurrentPrice() view external returns (uint256){
        return currentPrice;
    }

    /**  
    * @notice This function allows you to transfer ownership of the token contract to the specified address(_newOwner)
    * @dev This function checks the ownership of the platform and calls the token contract function to transfer ownership.
    * @param _newOwner - is the address of new owner of token contract.
    */
    function setTokenOwnership(address _newOwner) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Person doesnt have the DEFAULT_ADMIN_ROLE role");
        ERC20(tokenAddress).transferOwnership(_newOwner);
    }
}
