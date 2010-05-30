var Component = {};
Component.start = function()
{
  throw "Exception from Component";
};

var Framework = {};
Framework.start = function()
{
  Component.start();
};

Framework.start();
