// SPDX-License-Identifier: MIT
pragma solidity >=0.4.24 <0.8.0;

import "../libs/Eidas.sol";
import "../openzeppelin/Initializable.sol";

interface IAidIssuer {
    function initialize(address _firstIdentity) external;
    function isIdentityIssuer(address _identityIssuer) external view returns (bool);
}

contract AlastriaIdentityIssuer is Initializable {
  using Eidas for Eidas.EidasLevel;

  struct IdentityIssuer {
    Eidas.EidasLevel level;
    bool active;
  }

  mapping(address => IdentityIssuer) internal issuers;

  modifier onlyIdentityIssuer(address _identityIssuer) {
    require(issuers[_identityIssuer].active);
    _;
  }

  modifier notIdentityIssuer(address _identityIssuer) {
    require(!issuers[_identityIssuer].active);
    _;
  }

  modifier alLeastLow(Eidas.EidasLevel _level) {
    require(_level.atLeastLow());
    _;
  }

  function initialize(address _firstIdentity) public initializer {
    IdentityIssuer storage identityIssuer = issuers[_firstIdentity];
    identityIssuer.level = Eidas.EidasLevel.High;
    identityIssuer.active = true;
  }

  function addIdentityIssuer(address _identityIssuer, Eidas.EidasLevel _level)
    public
    alLeastLow(_level)
    notIdentityIssuer(_identityIssuer)
    onlyIdentityIssuer(msg.sender)
  {
    IdentityIssuer storage identityIssuer = issuers[_identityIssuer];
    identityIssuer.level = _level;
    identityIssuer.active = true;
  }

  function updateIdentityIssuerEidasLevel(address _identityIssuer, Eidas.EidasLevel _level)
    public
    alLeastLow(_level)
    onlyIdentityIssuer(msg.sender)
  {
    IdentityIssuer storage identityIssuer = issuers[_identityIssuer];
    identityIssuer.level = _level;
  }

  function deleteIdentityIssuer(address _identityIssuer) public onlyIdentityIssuer(msg.sender) {
    IdentityIssuer storage identityIssuer = issuers[_identityIssuer];
    identityIssuer.level = Eidas.EidasLevel.Null;
    identityIssuer.active = false;
  }

  function getEidasLevel(address _identityIssuer) public view returns (Eidas.EidasLevel) {
    return issuers[_identityIssuer].level;
  }

  function isIdentityIssuer(address _identityIssuer) public view returns (bool) {
    return issuers[_identityIssuer].active;
  }
}
