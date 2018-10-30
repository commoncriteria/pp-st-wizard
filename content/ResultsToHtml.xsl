<?xml version="1.0" encoding="utf-8"?>
<!--
    Stylesheet for Protection Profile Schema
    Based on original work by Dennis Orth
    Subsequent modifications in support of US NIAP
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
		xmlns='https://niap-ccevs.org/cc/report/v1'
		xmlns:cc='https://niap-ccevs.org/cc/pp/report/v1'
		xmlns:htm="http://www.w3.org/1999/xhtml"
		version="1.0">
  
  <!-- very important, for special characters and umlauts iso8859-1-->
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
 <!-- <xsl:output method="xml" encoding="UTF-8"/> -->


  <!-- -->
  <xsl:variable name="lower" select="'abcdefghijklmnopqrstuvwxyz'"/>
  <xsl:variable name="upper" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>

  <xsl:template match="/">
	<xsl:apply-templates/>
  </xsl:template>
  
  <xsl:template match="cc:section/cc:name">
    <h1><xsl:apply-templates/></h1>
  </xsl:template>
  <xsl:template match="cc:component/cc:name">
    <h2><xsl:apply-templates/></h2>
  </xsl:template>
  <xsl:template match="cc:requirement/cc:name">
    <h3><xsl:apply-templates/></h3>
  </xsl:template>

  <!-- -->
  <!-- Selectables template -->
  <!-- -->
  <xsl:template match="cc:selectables">[<span class="selection"><xsl:choose>      
    <!-- If the selection has a nested selection -->
    <xsl:when test=".//cc:selectables"><ul><xsl:for-each select="cc:selectable"><li><i><xsl:apply-templates/></i><xsl:call-template name="commaifnotlast"/></li></xsl:for-each></ul></xsl:when>
   <xsl:otherwise><xsl:for-each select="cc:selectable"><i><xsl:apply-templates/></i><xsl:call-template name="commaifnotlast"/></xsl:for-each></xsl:otherwise>
  </xsl:choose></span>]</xsl:template>

  <xsl:template match="cc:assignment">[<span class="assignment"><xsl:apply-templates/></span>]</xsl:template>



  <xsl:template match="cc:management-function-table"><table class="mfs" style="width: 100%;"><xsl:apply-templates/></table></xsl:template>
  
  <xsl:template match="cc:row"><tr><xsl:apply-templates/></tr></xsl:template>

  <xsl:template match="cc:row[1]/cc:val"><th><xsl:apply-templates/></th></xsl:template>
  <xsl:template match="cc:row/cc:val"><td><xsl:apply-templates/></td></xsl:template>


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
