<?xml version="1.0" encoding="utf-8"?>
<!--
    Stylesheet for Protection Profile Schema
    Based on original work by Dennis Orth
    Subsequent modifications in support of US NIAP
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:cc="https://niap-ccevs.org/cc/v1"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:htm="http://www.w3.org/1999/xhtml"
  version="1.0">
  
  <!-- very important, for special characters and umlauts iso8859-1-->
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>


  <!-- -->
  <xsl:variable name="lower" select="'abcdefghijklmnopqrstuvwxyz'"/>
  <xsl:variable name="upper" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>

  <xsl:template match="/cc:PP">
    <h2>Security Function Requirements (SFRs)</h2>
    <xsl:apply-templates select="//cc:section[//cc:f-component]"/>
    <h2>Security Assurance Requirements (SARs)</h2>
    <xsl:apply-templates select="//cc:section[//cc:a-component]"/>
  </xsl:template>
  

  <!-- Eat these -->
  <xsl:template match="cc:f-component[@disabled='yes']"/>
  <xsl:template match="cc:a-component[@disabled='yes']"/>
  <xsl:template match="cc:aactivity"/>
  <xsl:template match="cc:note"/>


  <xsl:template match="cc:section"><xsl:apply-templates select="cc:subsection"/></xsl:template>

  <xsl:template match="cc:subsection"><xsl:apply-templates select="cc:a-component|cc:f-component"/></xsl:template>

  <xsl:template match="cc:*[@linkend]"><xsl:value-of select="@linkend"/></xsl:template>
  
  <!-- -->
  <!-- Selectables template -->
  <!-- -->
  <xsl:template match="cc:selectables">[<span class="selection"><xsl:choose>      
    <xsl:when test="@linebreak='yes'"><ul><xsl:for-each select="cc:selectable[@selected='yes']"><li><i><xsl:apply-templates/></i><xsl:call-template name="commaifnotlast"/></li></xsl:for-each></ul></xsl:when>
    <xsl:when test="@linebreak='no'"><xsl:for-each select="cc:selectable[@selected='yes']"><i><xsl:apply-templates/></i><xsl:call-template name="commaifnotlast"/></xsl:for-each></xsl:when>
    <!-- If the selection has a nested selection -->
    <xsl:when test=".//cc:selectables"><ul><xsl:for-each select="cc:selectable[@selected='yes']"><li><i><xsl:apply-templates/></i><xsl:call-template name="commaifnotlast"/></li></xsl:for-each></ul></xsl:when>
   <xsl:otherwise><xsl:for-each select="cc:selectable[@selected='yes']"><i><xsl:apply-templates/></i><xsl:call-template name="commaifnotlast"/></xsl:for-each></xsl:otherwise>
  </xsl:choose></span>]</xsl:template>

  <xsl:template match="cc:assignable">[<span class="assignment"><xsl:value-of select="@val"/></span>]</xsl:template>

  <!-- Used to match regular ?-components -->
  <xsl:template match="cc:a-component"><h4><xsl:value-of select="concat(translate(@id, $lower, $upper), ' ')"/><xsl:value-of select="@name"/></h4><xsl:apply-templates select="cc:evalactionlabel|cc:a-element"/></xsl:template>

  <xsl:template match="cc:evalactionlabel"><h4><xsl:value-of select="@title"/></h4></xsl:template>

  <!-- Used to match regular ?-components -->
  <xsl:template match="cc:f-component"><h4><xsl:value-of select="concat(translate(@id, $lower, $upper), ' ')"/><xsl:value-of select="@name"/></h4><xsl:apply-templates select="cc:f-element"/></xsl:template>



<!-- THESE ARE BORROWED FROM OTHER XSL -->

  <xsl:template match="cc:management-function-set"><table class="mfs" style="width: 100%;"><tr class="header"><td>Management Function</td><xsl:apply-templates select="./cc:manager"/></tr><xsl:apply-templates select="./cc:management-function"/></table></xsl:template>
  
  
  <xsl:template match="cc:manager"><td> <xsl:apply-templates/> </td></xsl:template>

  <xsl:template match="cc:management-function"><tr><td><xsl:apply-templates select="cc:text"/></td><xsl:variable name="manfunc" select="."/><xsl:for-each select="../cc:manager"><xsl:variable name="id" select="@id"/><td><xsl:choose>
	      <!-- If we have something for that role -->
	      <xsl:when test="$manfunc/*[@ref=$id]">
		<xsl:choose>
		  <!-- And it is explicit, put it in there -->
		  <xsl:when test="$manfunc/*[@ref=$id]/node()"><xsl:apply-templates select="$manfunc/*[@ref=$id]/."/></xsl:when>
		  <xsl:otherwise><xsl:call-template name="make-management-value">
		    <xsl:with-param name="type">
		      <xsl:value-of select="name($manfunc/*[@ref=$id])"/></xsl:with-param>  </xsl:call-template></xsl:otherwise>
		</xsl:choose></xsl:when>
	      <xsl:otherwise><xsl:call-template name="make-management-value">
		<xsl:with-param name="type"><xsl:value-of select='../@default'/></xsl:with-param>
		</xsl:call-template></xsl:otherwise>
	    </xsl:choose></td></xsl:for-each></tr></xsl:template>


  <xsl:template name="make-management-value">
    <xsl:param name="type"/>
    <xsl:choose>
      <xsl:when test="$type='O'">O</xsl:when>
      <xsl:when test="$type='M'">X</xsl:when>
      <xsl:when test="$type='_'">-</xsl:when>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="cc:f-element | cc:a-element" ><div class="element"><xsl:variable name="reqid" select="translate(@id, $lower, $upper)"/><div class="reqid" id="{$reqid}"><xsl:value-of select="$reqid"/></div><div class="reqdesc"><xsl:apply-templates/></div></div></xsl:template>

  <xsl:template name="commaifnotlast"><xsl:if test="position() != last()"><xsl:text>, </xsl:text></xsl:if></xsl:template>

  <!--
       Change all htm tags to tags with no namespace.
       This should help the transition from output w/ polluted
       namespace to output all in htm namespace. For right now
       this is what we have.
  -->
  <xsl:template match="htm:*"><xsl:element name="{local-name()}">
      <!-- Copy all the attributes -->
      <xsl:for-each select="@*">
	<xsl:copy/>
      </xsl:for-each><xsl:apply-templates/></xsl:element></xsl:template>

  <!-- Consume all comments -->
  <xsl:template match="comment()"/>

  <!-- Consume all processing-instructions -->
  <xsl:template match="processing-instruction()"/>

  <!--
      Recursively copy and unwrap unmatched things (elements, attributes, text)
  -->
  <xsl:template match="@*|node()"><xsl:copy><xsl:apply-templates select="@*|node()"/></xsl:copy></xsl:template>

  <!-- 
       By default, quietly unwrap all cc elements that are otherwise unmatched
  -->
  <xsl:template match="cc:*"><xsl:apply-templates/></xsl:template>
</xsl:stylesheet>
